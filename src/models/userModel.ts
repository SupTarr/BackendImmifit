import mongoose, { Schema, Document, Model } from "mongoose";

export enum Role {
  User = 1000,
  Admin = 2000,
}

export interface IUser extends Document {
  userId: string;
  roles: Role[];
  email: string;
  username: string;
  password?: string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roles: {
      type: [Number],
      default: [Role.User],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
