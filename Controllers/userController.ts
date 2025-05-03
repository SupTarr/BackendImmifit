import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../Models/userModel.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

interface CreateUserBody {
  username?: string;
  email?: string;
  password?: string;
}

interface GetUserParams {
  user_id?: string;
}

interface ProfileRequestBody {
  username: string;
  about?: string;
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  bmi?: number;
}

export const getUserById = async (
  req: Request<GetUserParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res
        .status(400)
        .json({ message: "User ID parameter is required." });
    }

    const user: IUser | null = await User.findOne({ user_id })
      .select("-password -refreshToken")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    next(error);
  }
};

export const addUserProfile = async (
  req: Request<{}, {}, ProfileRequestBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { username, ...profileData } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ message: "Username is required in the request body." });
    }

    const foundUser: IUser | null = await User.findOne({
      username: username,
    }).exec();
    if (!foundUser) {
      return res
        .status(404)
        .json({ message: `User with username '${username}' not found.` });
    }

    if (!foundUser.profile) {
      foundUser.profile = {};
    }

    Object.assign(foundUser.profile, profileData);
    const updatedUser = await foundUser.save();
    res.status(200).json(updatedUser.profile);
  } catch (error) {
    console.error("Error adding/updating user profile:", error);
    next(error);
  }
};
