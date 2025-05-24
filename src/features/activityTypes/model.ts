import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivitieTypes extends Document {
  activityTypeId: string;
  name: string;
  description?: string;
}

const activitiesSchema: Schema<IActivitieTypes> = new Schema(
  {
    activityTypeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  },
);

const ActivityTypes: Model<IActivitieTypes> = mongoose.model<IActivitieTypes>(
  "ActivityTypes",
  activitiesSchema,
);

export default ActivityTypes;
