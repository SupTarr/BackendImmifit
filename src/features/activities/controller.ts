import { Elysia, NotFoundError } from "elysia";
import { cloudinary } from "../../cloudinary/config.js";
import mongoose from "mongoose";
import User from "../auth/model.js";
import Activities from "./model.js";
import { replaceCloudinaryImage } from "../../cloudinary/utils.js";
import { CreateActivityBodySchema, ActivityIdParamsSchema } from "./model.js";
import { verifyJwt } from "../jwt/middleware.js";

export const activitiesPlugin = new Elysia({ prefix: "/activities" })
  .use(verifyJwt)
  .get(
    "/",
    async ({ store, set }) => {
      try {
        const userExists = await User.exists({ userId: store.userId });
        if (!userExists) throw new NotFoundError("User not found");
        const activities = await Activities.find({ userId: store.userId }).sort(
          {
            date: -1, 
          },
        );

        set.status = 200;
        return { status: "SUCCESS", body: activities };
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
        return { status: "SUCCESS", body: activity };
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
    async ({ store, body, set }) => {
      try {
        const user = await User.findOne({ userId: store.userId });
        if (!user) {
          throw new NotFoundError("User specified not found.");
        }

        const uploadedImgData = await replaceCloudinaryImage(
          "activities",
          body.imageId,
          body.imageFile as File,
        );

        if (!uploadedImgData) {
          set.status = 500;
          return {
            status: "UPLOAD_FAILED",
            message: "Failed to upload image to Cloudinary.",
          };
        }

        const newActivity = new Activities({
          ...body,
          activityId: "ACTIVITIES:" + crypto.randomUUID(),
          userId: user.userId,
          img: uploadedImgData,
        });

        await newActivity.save();
        set.status = 201;
        return { status: "SUCCESS", body: newActivity };
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

  .delete(
    "/:activityId",
    async ({ params, set }) => {
      const { activityId } = params;
      try {
        const activity = await Activities.findOne({ activityId });
        if (!activity) {
          throw new NotFoundError("Activity not found.");
        }

        if (activity.image && activity.image.id) {
          try {
            await cloudinary.uploader.destroy(activity.image.id);
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
