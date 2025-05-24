import { t } from "elysia";
import mongoose, { Schema, Document, Model } from "mongoose";
import { IImage } from "../../models/image";

export const ActivityIdParamsSchema = t.Object({
  activityId: t.String({
    pattern: "^ACTIVITIES:[0-9a-fA-F]{24}$",
    error: "Invalid Activity ID format.",
  }),
});

export const CreateActivityBodySchema = t.Intersect([
  t.Object({
    imageFile: t.File({
      maxSize: "5m",
      type: ["image/jpeg", "image/png", "image/webp"],
      error: "Invalid image file provided.",
    }),
    imageId: t.String(),
    activityTypeId: t.String(),
    title: t.String(),
    description: t.Optional(t.String()),
    calories: t.Optional(
      t.Numeric({
        minimum: 0,
        error: "Calories must be a positive number.",
      }),
    ),
    startDate: t.String({
      format: "date-time",
      error: "Invalid start date format. Use ISO 8601.",
    }),
    endDate: t.String({
      format: "date-time",
      error: "Invalid end date format. Use ISO 8601.",
    }),
    date: t.String({
      format: "date-time",
      error: "Invalid date format. Use ISO 8601.",
    }),
  }),
]);

export interface IActivities extends Document {
  image: IImage;
  activityId: string;
  activityTypeId: string;
  userId: string;
  title: string;
  description?: string;
  calories?: number;
  startDate: Date;
  endDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const activitiesSchema: Schema<IActivities> = new Schema(
  {
    image: {
      id: String,
      url: String,
    },
    activityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    activityTypeId: {
      type: String,
      required: true,

    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    calories: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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
