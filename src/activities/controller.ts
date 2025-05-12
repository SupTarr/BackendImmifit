import { Elysia, NotFoundError, Static } from "elysia";
import { cloudinary } from "../configs/cloudinary.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Activities, { IActivities, IImage } from "../models/activitiesModel.js";
import {
  CreateActivityBodySchema,
  ActivityIdParamsSchema,
  UserIdParamsSchema,
  EditActivityBodySchema,
} from "./model.js";

type CreateActivityBodyType = Static<typeof CreateActivityBodySchema>;
type EditActivityBodyType = Static<typeof EditActivityBodySchema>;

async function uploadToCloudinary(file: File): Promise<IImage | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64String = buffer.toString("base64");
    const fileUri = `data:${file.type};base64,${base64String}`;
    const uploadResponse = await cloudinary.uploader.upload(fileUri, {
      upload_preset: "immifit",
      public_id: `immifit/${uuidv4()}`,
    });

    return {
      name: file.name,
      id: uploadResponse.public_id,
      url: uploadResponse.secure_url,
      contentType: file.type,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

export const activitiesPlugin = new Elysia({ prefix: "/activities" })
  .get(
    "/",
    async ({ set }) => {
      try {
        const activities = await Activities.find().sort({ date: -1 });
        set.status = 200;
        return { status: "SUCCESS", data: activities };
      } catch (error) {
        console.error("Error fetching all activities:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error fetching activities",
        };
      }
    },
    {
      detail: { summary: "Get All Activities", tags: ["Activities"] },
    },
  )

  .get(
    "/user/:userId",
    async ({ params, set }) => {
      const { userId } = params;
      try {
        const userExists = await User.exists({ userId: userId });
        if (!userExists) throw new NotFoundError("User not found");

        const activities = await Activities.find({ user_id: userId }).sort({
          date: -1,
        });
        set.status = 200;
        return { status: "SUCCESS", data: activities };
      } catch (error) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }
        console.error("Error fetching activities by user ID:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error fetching activities",
        };
      }
    },
    {
      params: UserIdParamsSchema,
      detail: { summary: "Get Activities by User ID", tags: ["Activities"] },
    },
  )

  .get(
    "/:activityId",
    async ({ params, set }) => {
      const { activityId } = params;
      try {
        const activity = await Activities.findOne({ activityId });
        if (!activity) {
          throw new NotFoundError("Activity not found");
        }
        set.status = 200;
        return { status: "SUCCESS", data: activity };
      } catch (error) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }
        console.error("Error fetching activity by ID:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error fetching activity",
        };
      }
    },
    {
      params: ActivityIdParamsSchema,
      detail: { summary: "Get Activity by ID", tags: ["Activities"] },
    },
  )

  .post(
    "/",
    async ({ body, set }: { body: CreateActivityBodyType; set: any }) => {
      const { img, userId, date, ...activityData } = body;

      try {
        const user = await User.findOne({ userId });
        if (!user) {
          throw new NotFoundError("User specified not found.");
        }

        const uploadedImgData = await uploadToCloudinary(img as File);
        if (!uploadedImgData) {
          set.status = 500;
          return {
            status: "UPLOAD_FAILED",
            message: "Failed to upload image to Cloudinary.",
          };
        }

        const newActivity = new Activities({
          ...activityData,
          activityId: uuidv4(),
          user_id: user.userId,
          img: uploadedImgData,
          date: new Date(date),
        });

        await newActivity.save();

        set.status = 201;
        return { status: "SUCCESS", data: newActivity };
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }
        if (error instanceof mongoose.Error.ValidationError) {
          set.status = 400;
          return {
            status: "VALIDATION_ERROR",
            message: "Activity data validation failed.",
            details: error.message,
          };
        }
        console.error("Error creating activity:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error creating activity",
        };
      }
    },
    {
      body: CreateActivityBodySchema,
      detail: { summary: "Create New Activity", tags: ["Activities"] },
    },
  )

  .put(
    "/:activityId",
    async ({
      params,
      body,
      set,
    }: {
      params: { activityId: string };
      body: EditActivityBodyType;
      set: any;
    }) => {
      const { activityId } = params;
      const { img, date, ...updateData } = body;

      if (Object.keys(updateData).length === 0 && !img) {
        set.status = 400;
        return { status: "BAD_REQUEST", message: "No update data provided." };
      }

      try {
        const existingActivity = await Activities.findOne({ activityId });
        if (!existingActivity) {
          throw new NotFoundError("Activity not found.");
        }

        let uploadedImgData: IImage | null | undefined = undefined;

        if (img && img instanceof File) {
          if (existingActivity.img && existingActivity.img.id) {
            try {
              await cloudinary.uploader.destroy(existingActivity.img.id);
            } catch (deleteError) {
              console.warn(
                "Cloudinary: Failed to delete old image during update:",
                deleteError,
              );
            }
          }

          uploadedImgData = await uploadToCloudinary(img);
          if (uploadedImgData === null) {
            set.status = 500;
            return {
              status: "UPLOAD_FAILED",
              message: "Failed to upload new image.",
            };
          }
        } else if (img !== undefined) {
          console.warn(
            "Received 'img' field in PUT request, but it was not a file.",
          );
        }

        const finalUpdateData: Partial<IActivities> = { ...updateData };
        if (uploadedImgData) {
          finalUpdateData.img = uploadedImgData;
        }

        const updatedActivity = await Activities.findOneAndUpdate(
          { activityId },
          { $set: finalUpdateData },
          { new: true, runValidators: true },
        );

        if (!updatedActivity) {
          throw new NotFoundError("Activity not found after update attempt.");
        }

        set.status = 200;
        return { status: "SUCCESS", data: updatedActivity };
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }
        if (error instanceof mongoose.Error.ValidationError) {
          set.status = 400;
          return {
            status: "VALIDATION_ERROR",
            message: "Activity data validation failed.",
            details: error.message,
          };
        }
        console.error("Error editing activity:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error editing activity",
        };
      }
    },
    {
      params: ActivityIdParamsSchema,
      body: EditActivityBodySchema,
      detail: { summary: "Edit Activity by ID", tags: ["Activities"] },
    },
  )

  .delete(
    "/:activityId",
    async ({ params, set }) => {
      const { activityId } = params;
      try {
        const activity = await Activities.findOne({ activityId });
        if (!activity) {
          throw new NotFoundError("Activity not found.");
        }

        if (activity.img && activity.img.id) {
          try {
            await cloudinary.uploader.destroy(activity.img.id);
          } catch (deleteError) {
            console.error(
              "Cloudinary delete error (activity deletion):",
              deleteError,
            );
          }
        }

        const deleteResult = await Activities.deleteOne({ activityId });
        if (deleteResult.deletedCount === 0) {
          throw new NotFoundError(
            "Activity not found during deletion attempt.",
          );
        }

        set.status = 204;
        return;
      } catch (error: any) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }
        console.error("Error removing activity:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error removing activity",
        };
      }
    },
    {
      params: ActivityIdParamsSchema,
      detail: { summary: "Delete Activity by ID", tags: ["Activities"] },
    },
  );
