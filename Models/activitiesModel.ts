import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImage {
  name: string;
  id?: string;
  url?: string;
  contentType?: string;
}

export interface IActivities extends Document {
  img: IImage;
  activityId: string;
  userId: string;
  type: "Running" | "Cycling" | "Swimming" | "Weight training" | "Walking";
  title: string;
  startTime: Date;
  endTime: Date;
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
