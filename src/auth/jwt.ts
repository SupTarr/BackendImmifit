import jwt from "jsonwebtoken";
import { IUser } from "../models/userModel.js";
import config from "../configs/config.js";
import { AccessTokenPayload, RefreshTokenPayload } from "./model.js";

export async function generateAndSetTokens(user: IUser, cookie: any): Promise<string> {
  const accessToken = jwt.sign(
    {
      userId: user.userId,
      roles: user.roles,
    } as AccessTokenPayload,
    config.accessTokenSecret,
    { expiresIn: "15m" },
  );

  const newRefreshToken = jwt.sign(
    { userId: user.userId } as RefreshTokenPayload,
    config.refreshTokenSecret,
    { expiresIn: "1d" },
  );

  user.refreshToken = newRefreshToken;
  await user.save();

  cookie.jwt.set({
    value: newRefreshToken,
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60, 
    path: "/",
    sameSite: "strict",
  });

  return accessToken;
}
