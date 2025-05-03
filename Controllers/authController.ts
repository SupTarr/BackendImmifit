import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../Models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import { v4 as uuidv4 } from "uuid";

interface CreateUserBody {
  username?: string;
  email?: string;
  password?: string;
}

interface JwtPayload {
  UserInfo: {
    username: string;
  };
}

interface RefreshTokenPayload {
  username: string;
}

interface RequestWithCookies extends Request {
  cookies: {
    jwt?: string;
  };
}

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

export const handleRegister = async (
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

export const handleLogout = async (req: RequestWithCookies, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }

  const refreshToken = cookies.jwt;
  try {
    const foundUser = await User.findOne({ refreshToken }).exec();
    res.clearCookie("jwt", { httpOnly: true, secure: true });

    if (!foundUser) {
      return res.sendStatus(204);
    }

    foundUser.refreshToken = undefined;
    await foundUser.save();

    res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);
    res.clearCookie("jwt", { httpOnly: true, secure: true });
    res.status(500).json({ message: "Internal server error during logout" });
  }
};
