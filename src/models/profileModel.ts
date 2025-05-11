import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./userModel.js";

export enum Gender {
  male = 'male',
  female = 'female',
  other = 'other',
}

export interface IProfile extends Document {
  profileId: string;
  userId: IUser["userId"];
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  height?: number;
  weight?: number;
  bmi?: number;
  goal?: string;
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
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    height: {
      type: Number,
      min: 0,
    },
    weight: {
      type: Number,
      min: 0,
    },
    bmi: {
      type: Number,
      min: 0,
    },
    goal: {
      type: String,
      trim: true,
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
