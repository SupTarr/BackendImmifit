import { Request, Response } from "express";
import User, { IUser } from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";

interface JwtPayload {
  UserInfo: {
    username: string;
  };
}

interface RefreshTokenPayload {
  username: string;
}

export const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  const foundUser: IUser | null = await User.findOne({ username: username })
    .select("+password")
    .exec();

  if (!foundUser) {
    return res.sendStatus(401);
  }

  if (!foundUser.password) {
    console.error(`Password field missing for user: ${username}`);
    return res.sendStatus(500);
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    const roles = Object.values(foundUser.roles || {}).filter(
      (role): role is number => typeof role === "number",
    );
    const user_id = foundUser.user_id;
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: roles,
        },
      } as JwtPayload,
      config.accessTokenSecret,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { username: foundUser.username } as RefreshTokenPayload,
      config.refreshTokenSecret,
      { expiresIn: "1d" },
    );

    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ roles, user_id, accessToken });
  } else {
    res.sendStatus(401);
  }
};
