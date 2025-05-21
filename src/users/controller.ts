import { Elysia, t } from "elysia";
import User, { IUser } from "../models/userModel.js";
import Profile, { IProfile } from "../models/profileModel.js";
import { ProfileBodySchema } from "./model.js";
import { verifyJwt } from "../jwt/middleware.js";
import { replaceCloudinaryImage } from "../cloudinary/utils.js";

export const userPlugin = new Elysia({ prefix: "/users" })
  .use(verifyJwt)
  .get(
    "/",
    async ({ store, set }) => {
      try {
        const user: IUser | null = await User.findOne({
          userId: store.userId,
        })
          .select("-_id -__v -password -refreshToken -roles")
          .exec();

        if (!user) {
          set.status = 400;
          return { status: "INVALID_REQUEST", message: "User not found" };
        }

        const profile: IProfile | null = await Profile.findOne({
          userId: store.userId,
        })
          .select("-__v -_id")
          .exec();

        const { _id, __v, ...cleanProfile } = profile?.toObject();
        set.status = 200;
        return { status: "SUCCESS", body: { ...cleanProfile } };
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
    "/",
    async ({ store, body, set }) => {
      try {
        const userExists = await User.exists({ userId: store.userId });
        if (!userExists) {
          set.status = 400;
          return {
            status: "INVALID_REQUEST",
            message: `User not found`,
          };
        }

        const bmi = body.weight / (body.height * body.height);
        const updatePayload: Partial<IProfile> = {
          ...body,
          bmi: Number(bmi.toFixed(2)),
        };

        if (body.file) {
          const res = await replaceCloudinaryImage(
            "profile",
            body?.imageId,
            body.file,
          );

          updatePayload.image = {
            id: res?.id,
            url: res?.url,
          };
        }

        const updateOperation: any = {
          $set: updatePayload,
          $setOnInsert: {
            profileId: "PROFILE:" + crypto.randomUUID(),
            userId: store.userId,
          },
        };

        const updatedProfile = await Profile.findOneAndUpdate(
          { userId: store.userId },
          updateOperation,
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        )
          .select("-__v -_id")
          .exec();

        const { _id, __v, ...cleanProfile } = updatedProfile.toObject();
        set.status = 200;
        return { status: "SUCCESS", body: cleanProfile };
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
