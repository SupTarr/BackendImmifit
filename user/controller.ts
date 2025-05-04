import { Elysia, t } from "elysia";
import { v4 as uuidv4 } from "uuid";
import User, { IUser } from "../models/userModel.js";
import Profile, { IProfile } from "../models/profileModel.js";
import { UserIdParamsSchema, ProfileBodySchema } from "./model.js";

type ProfileBodyType = typeof ProfileBodySchema.static;

export const userPlugin = new Elysia({ prefix: "/users" })
  .get(
    "/:userId",
    async ({ params, set }) => {
      const { userId } = params;
      try {
        const user: IUser | null = await User.findOne({ userId: userId })
          .select("-password -refreshToken -roles")
          .exec();

        if (!user) {
          set.status = 404;
          return { status: "NOT_FOUND", message: "User not found" };
        }

        set.status = 200;
        return { status: "SUCCESS", data: user };
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user.",
        };
      }
    },
    {
      params: UserIdParamsSchema,
      detail: {
        summary: "Get User by ID",
        tags: ["Users"],
      },
    },
  )

  .put(
    "/:userId/profile",
    async ({
      params,
      body,
      set,
    }: {
      params: { userId: string };
      body: ProfileBodyType;
      set: any;
    }) => {
      // Explicitly type body
      const { userId } = params;
      const profileData = body;
      if (Object.keys(profileData).length === 0) {
        set.status = 400;
        return {
          status: "BAD_REQUEST",
          message: "Request body cannot be empty.",
        };
      }

      try {
        const userExists = await User.exists({ userId: userId });
        if (!userExists) {
          set.status = 404;
          return {
            status: "NOT_FOUND",
            message: `User with ID '${userId}' not found. Cannot update profile.`,
          };
        }

        const updatePayload: Partial<IProfile> = { ...profileData };
        let unsetPayload: { [key: string]: any } = {};
        const height = profileData.height;
        const weight = profileData.weight;

        if (height !== undefined && weight !== undefined && height > 0) {
          const heightInMeters = height / 100;
          updatePayload.bmi = parseFloat(
            (weight / (heightInMeters * heightInMeters)).toFixed(2),
          );
        } else {
          if (
            profileData.hasOwnProperty("height") ||
            profileData.hasOwnProperty("weight")
          ) {
            unsetPayload["bmi"] = "";
          }
        }

        const updateOperation: any = {
          $set: updatePayload,
          $setOnInsert: {
            profileId: uuidv4(),
            userId: userId,
          },
        };

        if (Object.keys(unsetPayload).length > 0) {
          updateOperation.$unset = unsetPayload;
        }

        const updatedProfile = await Profile.findOneAndUpdate(
          { userId: userId },
          updateOperation,
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        ).select("-__v");

        if (!updatedProfile) {
          set.status = 500;
          return {
            status: "INTERNAL_SERVER_ERROR",
            message: "Failed to update or create profile.",
          };
        }

        set.status = 200;
        const {
          _id,
          userId: profileUserId,
          profileId,
          ...profileToReturn
        } = updatedProfile.toObject();
        return { status: "SUCCESS", data: profileToReturn };
      } catch (error: any) {
        console.error("Error adding/updating user profile:", error);
        if (error.name === "ValidationError") {
          set.status = 400;
          return {
            status: "VALIDATION_ERROR",
            message: "Profile data validation failed.",
            details: error.message,
          };
        }
        if (error.code === 11000) {
          set.status = 409;
          return {
            status: "CONFLICT",
            message: "Profile creation conflict, please retry.",
          };
        }
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile.",
        };
      }
    },
    {
      params: UserIdParamsSchema,
      body: ProfileBodySchema,
      detail: {
        summary: "Update or Create User Profile by User ID",
        tags: ["Users", "Profile"],
      },
    },
  );
