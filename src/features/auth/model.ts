import { t } from "elysia";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Role } from "./const.js";

export const LoginBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const RegisterBodySchema = t.Object({
  email: t.String({ format: "email" }),
  username: t.String({ minLength: 3 }),
  password: t.String({ minLength: 8 }),
});

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
