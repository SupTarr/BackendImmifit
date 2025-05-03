import { Request, Response, NextFunction } from "express";
import User from "../Models/userModel.js";
import Activities from "../Models/activitiesModel.js";
import { cloudinary } from "../configs/cloudinary.config.js";
import { v4 as uuidv4 } from "uuid";

interface ActivityParams {
  activity_id?: string;
  username?: string;
  type?: string;
}

interface BaseActivityData {
  activity_type: string;
  duration: number;
  calories: number;
  distance?: number;
  description?: string;
  date: Date | string;
}

interface ImageData {
  data: string;
  name: string;
  contentType: string;
}

interface CreateActivityBody extends BaseActivityData {
  username: string;
  img: ImageData;
}

interface EditActivityBody extends Partial<BaseActivityData> {
  img?: ImageData;
}

export const getAllActivities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const activities = await Activities.find();
    res.status(200).send(activities);
  } catch (error) {
    console.error("Error fetching all activities:", error);
    res.status(500).send({ message: "Error fetching activities" });
  }
};

export const getActivityById = async (
  req: Request<ActivityParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { activity_id } = req.params;
    if (!activity_id) {
      return res
        .status(400)
        .send({ message: "Activity ID parameter is required" });
    }

    const activity = await Activities.findOne({ activity_id });
    if (!activity) {
      return res.status(404).send({ message: "Activity not found" });
    }

    res.status(200).send(activity);
  } catch (error) {
    console.error("Error fetching activity by ID:", error);
    res.status(500).send({ message: "Error fetching activity" });
  }
};

export const getActivityByUsername = async (
  req: Request<ActivityParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res
        .status(400)
        .send({ message: "Username parameter is required" });
    }

    const activities = await Activities.find({ username: username });
    res.status(200).send(activities);
  } catch (error) {
    console.error("Error fetching activities by username:", error);
    res.status(500).send({ message: "Error fetching activities" });
  }
};

export const getActivityByType = async (
  req: Request<ActivityParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, type } = req.params;
    if (!username || !type) {
      return res
        .status(400)
        .send({ message: "Username and type parameters are required" });
    }
    const activities = await Activities.find({
      username: username,
      activity_type: type,
    });
    res.status(200).send(activities);
  } catch (error) {
    console.error("Error fetching activities by type:", error);
    res.status(500).send({ message: "Error fetching activities" });
  }
};

export const createActivity = async (
  req: Request<{}, {}, CreateActivityBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, img, ...activityData } = req.body;

    if (
      !username ||
      !img ||
      !img.data ||
      !activityData.activity_type ||
      !activityData.duration ||
      !activityData.calories ||
      !activityData.date
    ) {
      return res
        .status(400)
        .send({ message: "Missing required fields for activity creation." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const fileStr = img.data;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: "immifit",
    });

    const newActivity = new Activities({
      ...activityData,
      activity_id: uuidv4(),
      username: user.username,
      user_id: user.user_id,
      img: {
        name: img.name,
        id: uploadResponse.asset_id,
        url: uploadResponse.secure_url,
        contentType: img.contentType,
      },
      date: new Date(activityData.date),
    });

    await newActivity.save();
    res.status(201).send(newActivity);
  } catch (error) {
    console.error("Error creating activity:", error);
    res
      .status(400)
      .send({
        message: "Error creating activity",
        error: error instanceof Error ? error.message : String(error),
      });
  }
};

export const editActivityById = async (
  req: Request<ActivityParams, {}, EditActivityBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { activity_id } = req.params;
    if (!activity_id) {
      return res
        .status(400)
        .send({ message: "Activity ID parameter is required" });
    }
    const { img, ...updateData } = req.body;

    let uploadedImgData;
    if (img && img.data) {
      try {
        const fileStr = img.data;
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
          upload_preset: "immifit",
        });
        uploadedImgData = {
          name: img.name,
          id: uploadResponse.asset_id,
          url: uploadResponse.secure_url,
          contentType: img.contentType,
        };
      } catch (uploadError) {
        console.error("Cloudinary upload error during edit:", uploadError);
        return res.status(500).send({ message: "Failed to upload new image" });
      }
    }

    const finalUpdateData: Partial<typeof Activities.schema.obj> = {
      ...updateData,
      activity_type: updateData.activity_type as
        | "Running"
        | "Cycling"
        | "Swimming"
        | "Weight training"
        | "Walking"
        | undefined,
    };
    if (uploadedImgData) {
      finalUpdateData.img = uploadedImgData;
    }
    if (updateData.date) {
      finalUpdateData.date = new Date(updateData.date);
    }

    const updatedActivity = await Activities.findOneAndUpdate(
      { activity_id },
      { $set: finalUpdateData },
      { new: true, runValidators: true },
    );

    if (!updatedActivity) {
      return res
        .status(404)
        .send({ message: "Activity not found or failed to update." });
    }

    res.status(200).send(updatedActivity);
  } catch (error) {
    console.error("Error editing activity:", error);
    res
      .status(400)
      .send({
        message: "Error editing activity",
        error: error instanceof Error ? error.message : String(error),
      });
  }
};

export const removeActivityById = async (
  req: Request<ActivityParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { activity_id } = req.params;
    if (!activity_id) {
      return res
        .status(400)
        .send({ message: "Activity ID parameter is required" });
    }

    const activity = await Activities.findOne({ activity_id });

    if (!activity) {
      return res.status(404).send({ message: "Activity not found" });
    }

    // Optional: Delete image from Cloudinary
    if (activity.img && activity.img.id) {
      try {
        await cloudinary.uploader.destroy(activity.img.id);
      } catch (deleteError) {
        console.error("Cloudinary delete error:", deleteError);
        // Decide if you want to stop the process or just log the error
      }
    }

    const deleteResult = await Activities.deleteOne({ activity_id });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ message: "Activity not found during deletion attempt." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing activity:", error);
    res.status(500).send({ message: "Error removing activity" });
  }
};
