import mongoose, { Schema, Document, Model } from "mongoose";

interface IRoles {
  User?: number;
  Editor?: number;
  Admin?: number;
}

interface IProfile {
  about?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
}

export interface IUser extends Document {
  user_id: string;
  roles: IRoles;
  username: string;
  email: string;
  password?: string;
  refreshToken?: string;
  profile?: IProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roles: {
      User: {
        type: Number,
        default: 1000,
      },
      Editor: Number,
      Admin: Number,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
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
    profile: {
      about: String,
      gender: String,
      age: Number,
      height: Number,
      weight: Number,
      bmi: Number,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
