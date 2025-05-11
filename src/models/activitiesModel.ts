import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImage {
  name: string;
  id?: string;
  url?: string;
  contentType?: string;
}

export interface IActivities extends Document {
  activityId: string;
  user_id: string;
  type: "Running" | "Cycling" | "Swimming" | "Weight training" | "Walking";
  title: string;
  date: Date;
  duration: number;
  calories: number;
  description?: string;
  img: IImage;
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
    user_id: {
      type: String,
      required: true,
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
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    calories: {
      type: Number,
      required: true,
      min: 0,
    },
    description: String,
    img: {
      name: {
        type: String,
        required: true,
      },
      id: String,
      url: String,
      contentType: String,
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
