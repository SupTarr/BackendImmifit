import { Elysia, t } from "elysia";
import User, { IUser } from "../models/userModel.js";
import Profile, { IProfile } from "../models/profileModel.js";
import { ProfileBodySchema } from "./model.js";
import { verifyJwt } from "../jwt/middleware.js";

export const userPlugin = new Elysia({ prefix: "/users" })
  .use(verifyJwt)
  .get(
    "/profile",
    async ({ userId, set }) => {
      try {
        const user: IUser | null = await User.findOne({
          userId: userId,
        })
          .select("-_id -__v -password -refreshToken -roles")
          .exec();

        if (!user) {
          set.status = 400;
          return { status: "INVALID_REQUEST", message: "User not found" };
        }

        const profile: IProfile | null = await Profile.findOne({
          userId: userId,
        }).select("-__v");

        set.status = 200;
        return { status: "SUCCESS", body: { user, profile } };
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        };
      }
    },
    {
      detail: {
        summary: "Get User by ID",
        tags: ["Users"],
      },
    },
  )
  .post(
    "/profile",
    async ({ userId, body, set }) => {
      try {
        const userExists = await User.exists({ userId: userId });
        if (!userExists) {
          set.status = 400;
          return {
            status: "INVALID_REQUEST",
            message: `User not found`,
          };
        }

        const cmHeight = body.height / 100;
        const bmi = body.weight / (cmHeight * cmHeight);
        const updatePayload: Partial<IProfile> = { ...body, bmi };
        const updateOperation: any = {
          $set: updatePayload,
          $setOnInsert: {
            profileId: "PROFILE:" + crypto.randomUUID(),
            userId: userId,
          },
        };

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

        set.status = 200;
        const { _id, profileId, ...profileToReturn } =
          updatedProfile.toObject();
        return { status: "SUCCESS", data: profileToReturn };
      } catch (error: any) {
        console.error("Error adding/updating user profile:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile.",
        };
      }
    },
    {
      body: ProfileBodySchema,
      detail: {
        summary: "Update or Create User Profile by User ID",
        tags: ["Users", "Profile"],
      },
    },
  );
