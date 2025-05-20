import mongoose, { Schema, Document, Model } from "mongoose";
import { IImage } from "./imageModel.js";

export interface IActivities extends Document {
  activityId: string;
  userId: string;
  type: "Running" | "Cycling" | "Swimming" | "Weight training" | "Walking";
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  image: IImage;
  createdAt?: Date;
  updatedAt?: Date;
}

const activitiesSchema: Schema<IActivities> = new Schema(
  {
    activityId: {
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
    },
    type: {
      type: String,
      required: true,
      enum: ["Running", "Cycling", "Swimming", "Weight training", "Walking"],
    },
    title: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    description: String,
    image: {
      id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  },
);

const Activities: Model<IActivities> = mongoose.model<IActivities>(
  "Activities",
  activitiesSchema,
);

export default Activities;
