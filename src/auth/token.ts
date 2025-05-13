import { IUser } from "../models/userModel.js";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  JwtUtility,
  AppCookieStore,
} from "./model.js";

export async function generateAndSetTokens(
  access: JwtUtility<AccessTokenPayload>,
  refresh: JwtUtility<RefreshTokenPayload>,
  cookie: AppCookieStore,
  user: IUser,
): Promise<string> {
  const accessToken = await access.sign({
    userId: user.userId,
    roles: user.roles,
  } as AccessTokenPayload);

  const newRefreshToken = await refresh.sign({
    userId: user.userId,
  } as RefreshTokenPayload);

  user.refreshToken = newRefreshToken;
  await user.save();

  cookie.jwt.set({
    path: "/auth",
    value: newRefreshToken,
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60,
    sameSite: "strict",
  });

  return accessToken;
}
