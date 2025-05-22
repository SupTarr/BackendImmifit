import { t } from "elysia";
import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "../auth/model.js";
import { IImage } from "../../models/image.js";
import { Gender } from "./const.js";

export const ProfileBodySchema = t.Object({
  imageId: t.Optional(t.String()),
  imageFile: t.Optional(t.File({ format: "image/*" })),
  about: t.Optional(t.String()),
  gender: t.Numeric(Gender),
  age: t.Numeric({ minimum: 0 }),
  height: t.Numeric({ minimum: 0 }),
  weight: t.Numeric({ minimum: 0 }),
});

export interface IProfile extends Document {
  profileId: string;
  userId: IUser["userId"];
  about?: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  bmi?: number;
  image?: IImage;
  createdAt?: Date;
  updatedAt?: Date;
}

const profileSchema: Schema<IProfile> = new Schema(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "User",
    },
    about: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    gender: {
      type: Number,
      required: true,
      enum: Object.values(Gender).filter((v) => typeof v === "number"),
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    height: {
      type: Number,
      required: true,
      min: 0,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    bmi: {
      type: Number,
      min: 0,
    },
    image: {
      id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  },
);

const Profile: Model<IProfile> = mongoose.model<IProfile>(
  "Profile",
  profileSchema,
);

export default Profile;
