import express, { Request, Response, NextFunction, Router } from "express";
import Activities, { IActivities } from "../Models/activitiesModel.js";
import * as activitiesController from "../Controllers/activitiesController.js";

const activityRoutes: Router = express.Router();

activityRoutes.param(
  "activity_id",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
    activity_id: string,
  ) => {
    try {
      const activity = await Activities.findOne({ activity_id: activity_id });
      if (!activity) {
        return res
          .status(404)
          .send({ message: "Activity not found via param handler" });
      }

      next();
    } catch (error) {
      console.error("Error in activity_id param handler:", error);
      next(error);
    }
  },
);
activityRoutes.get("/", activitiesController.getAllActivities as any);

activityRoutes.get(
  "/:username",
  activitiesController.getActivityByUsername as any,
);

activityRoutes.get(
  "/byid/:activity_id",
  activitiesController.getActivityById as any,
);

activityRoutes.get(
  "/bytype/:username/:type",
  activitiesController.getActivityByType as any,
);

activityRoutes.post("/", activitiesController.createActivity as any);

activityRoutes.put(
  "/:activity_id",
  activitiesController.editActivityById as any,
);

activityRoutes.delete(
  "/:activity_id",
  activitiesController.removeActivityById as any,
);

export default activityRoutes;
