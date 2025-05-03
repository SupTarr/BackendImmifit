import { Request, Response } from "express";
import User, { IUser } from "../Models/userModel.js";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";

interface RequestWithCookies extends Request {
  cookies: {
    jwt?: string;
  };
}

interface DecodedRefreshToken {
  username: string;
  iat: number;
  exp: number;
}

interface AccessTokenPayload {
  UserInfo: {
    username: string;
    roles: number[];
  };
}

export const handleRefreshToken = async (
  req: RequestWithCookies,
  res: Response,
) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(401);
  }
  const refreshToken = cookies.jwt;

  try {
    const foundUser: IUser | null = await User.findOne({ refreshToken })
      .select("+refreshToken")
      .exec();
    if (!foundUser) {
      res.clearCookie("jwt", { httpOnly: true, secure: true });
      return res.sendStatus(403);
    }

    jwt.verify(
      refreshToken,
      config.refreshTokenSecret,
      (err: jwt.VerifyErrors | null, decoded: object | string | undefined) => {
        if (
          err ||
          !decoded ||
          typeof decoded !== "object" ||
          !("username" in decoded) ||
          foundUser.username !== (decoded as DecodedRefreshToken).username
        ) {
          res.clearCookie("jwt", { httpOnly: true, secure: true });
          return res.sendStatus(403);
        }

        const decodedPayload = decoded as DecodedRefreshToken;
        const roles = Object.values(foundUser.roles || {}).filter(
          (role): role is number => typeof role === "number",
        );

        const accessToken = jwt.sign(
          {
            UserInfo: {
              username: decodedPayload.username,
              roles: roles,
            },
          } as AccessTokenPayload,
          config.accessTokenSecret,
          { expiresIn: "15m" },
        );

        res.json({ roles, accessToken });
      },
    );
  } catch (error) {
    console.error("Error handling refresh token:", error);
    res.clearCookie("jwt", { httpOnly: true, secure: true });
    res.sendStatus(500);
  }
};
