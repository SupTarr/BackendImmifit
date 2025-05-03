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

export const createUser = async (
  req: Request<{}, {}, CreateUserBody>,
  res: Response,
  next: NextFunction,
) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "Username, email, and password are required." });
  }

  try {
    const duplicateUser = await User.findOne({ username: username }).exec();
    if (duplicateUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const duplicateEmail = await User.findOne({ email: email }).exec();
    if (duplicateEmail) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: username,
      user_id: uuidv4(),
      email: email,
      password: hashedPwd,
    });

    res
      .status(201)
      .json({
        success: `New user ${username} created!`,
        userId: newUser.user_id,
      });
  } catch (error) {
    console.error("Error creating user:", error);
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users: IUser[] = await User.find()
      .select("-password -refreshToken")
      .exec();
    if (!users || users.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    next(error);
  }
};

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
