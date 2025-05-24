import { Elysia, NotFoundError } from "elysia";
import User from "../auth/model.js";
import ActivityTypes from "./model.js";
import { verifyJwt } from "../jwt/middleware.js";

export const activityTypesPlugin = new Elysia({ prefix: "/activity-types" })
  .use(verifyJwt)
  .get(
    "/",
    async ({ store, set }) => {
      try {
        const userExists = await User.exists({ userId: store.userId });
        if (!userExists) throw new NotFoundError("User not found");
        const activityTypes = await ActivityTypes.find({});

        set.status = 200;
        return { status: "SUCCESS", body: activityTypes };
      } catch (error) {
        if (error instanceof NotFoundError) {
          set.status = 404;
          return { status: "NOT_FOUND", message: error.message };
        }

        console.error("Error fetching activity types:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Error fetching activities",
        };
      }
    },
    {
      detail: { summary: "Get Activity Types", tags: ["Activity Types"] },
    },
  )