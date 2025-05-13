import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./userModel.js";

export enum Gender {
  Man = 1000,
  Woman = 2000,
}

export interface IProfile extends Document {
  profileId: string;
  userId: IUser["userId"];
  about?: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  bmi?: number;
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
