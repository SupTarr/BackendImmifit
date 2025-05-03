import mongoose, { Schema, Document, Model } from "mongoose";

interface IImage {
  name: string;
  id?: string;
  url?: string;
  contentType?: string;
}

export interface IActivities extends Document {
  img: IImage;
  activity_id: string;
  username: string;
  user_id?: string;
  activity_type:
    | "Running"
    | "Cycling"
    | "Swimming"
    | "Weight training"
    | "Walking";
  title: string;
  date: Date;
  start_time: Date;
  end_time: Date;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const activitiesSchema: Schema<IActivities> = new Schema(
  {
    img: {
      name: {
        type: String,
        required: true,
      },
      id: String,
      url: String,
      contentType: String,
    },
    activity_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: String,
    },
    activity_type: {
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
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    description: String,
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
