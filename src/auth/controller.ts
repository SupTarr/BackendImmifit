import { Elysia, Static } from "elysia";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import config from "../configs/config.js";
import User, { IUser } from "../models/userModel.js";
import {
  LoginBodySchema,
  RegisterBodySchema,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./model.js";

type LoginBodyType = Static<typeof LoginBodySchema>;
type RegisterBodyType = Static<typeof RegisterBodySchema>;

export const authPlugin = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({
      body,
      cookie,
      set,
    }: {
      body: LoginBodyType;
      cookie: any;
      set: any;
    }) => {
      const { email, password } = body;
      const foundUser: IUser | null = await User.findOne({ email: email })
        .select("+password +refreshToken")
        .exec();

      if (!foundUser || !foundUser.password) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid email or password",
        };
      }

      const match = await bcrypt.compare(password, foundUser.password);

      if (match) {
        const accessToken = jwt.sign(
          {
            userId: foundUser.userId,
            roles: foundUser.roles,
          } as AccessTokenPayload,
          config.accessTokenSecret,
          { expiresIn: "15m" },
        );

        const refreshToken = jwt.sign(
          { userId: foundUser.userId } as RefreshTokenPayload,
          config.refreshTokenSecret,
          { expiresIn: "1d" },
        );

        foundUser.refreshToken = refreshToken;
        await foundUser.save();

        cookie.jwt.set({
          value: refreshToken,
          httpOnly: true,
          secure: "production",
          maxAge: 24 * 60 * 60,
          path: "/",
          sameSite: "strict",
        });

        set.status = 200;
        return { status: "SUCCESS", body: { accessToken } };
      } else {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid email or password",
        };
      }
    },
    { body: LoginBodySchema },
  )

  .post(
    "/register",
    async ({ body, set }: { body: RegisterBodyType; set: any }) => {
      const { email, password } = body;
      const duplicateEmail = await User.findOne({ email: email }).exec();
      if (duplicateEmail) {
        set.status = 409;
        return { status: "INVALID_REQUEST", message: "Email already exists" };
      }

      try {
        const hashedPwd = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          userId: uuidv4(),
          email: email,
          password: hashedPwd,
        } as Partial<IUser>);

        set.status = 200;
        return {
          status: "SUCCESS",
          body: { userId: newUser.userId },
        };
      } catch (error: any) {
        console.error("Error creating user:", error);
        set.status = 500;
        return {
          status: "INTERNAL_SERVER_ERROR",
          message: "Failed to register user",
        };
      }
    },
    { body: RegisterBodySchema },
  )

  .post("/refresh", async ({ cookie, set }) => {
    const refreshToken = cookie.jwt;
    if (!refreshToken || typeof refreshToken !== "string") {
      set.status = 400;
      return {
        status: "INVALID_REQUEST",
        message: "Refresh token missing or invalid",
      };
    }

    try {
      const foundUser: IUser | null = await User.findOne({
        refreshToken: refreshToken,
      }).exec();

      if (!foundUser) {
        cookie.jwt.remove();
        set.status = 400;
        return { status: "INVALID_REQUEST", message: "Invalid refresh token" };
      }

      const decoded = jwt.verify(
        refreshToken,
        config.refreshTokenSecret,
      ) as RefreshTokenPayload;

      if (foundUser.userId !== decoded.userId) {
        cookie.jwt.remove();
        set.status = 400;
        return { status: "INVALID_REQUEST", message: "Refresh token mismatch" };
      }

      const roles = Object.values(foundUser.roles || {}).filter(
        (role): role is number => typeof role === "number",
      );
      const accessToken = jwt.sign(
        { userId: foundUser.userId, roles: roles } as AccessTokenPayload,
        config.accessTokenSecret,
        { expiresIn: "15m" },
      );

      set.status = 200;
      return { status: "SUCCESS", body: { accessToken } };
    } catch (error) {
      console.error("Error handling refresh token:", error);
      cookie.jwt.remove();
      if (error instanceof jwt.JsonWebTokenError) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid or expired refresh token",
        };
      }

      set.status = 500;
      return {
        status: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh token",
      };
    }
  })

  .get("/logout", async ({ cookie, set }) => {
    const refreshToken = cookie.jwt;
    if (!refreshToken || typeof refreshToken !== "string") {
      set.status = 200;
      return { status: "SUCCESS" };
    }

    try {
      await User.updateOne(
        { refreshToken: refreshToken },
        { $unset: { refreshToken: 1 } },
      );

      cookie.jwt.remove();
      set.status = 200;
      return { status: "SUCCESS" };
    } catch (error) {
      console.error("Logout error:", error);
      cookie.jwt.remove();
      set.status = 500;
      return {
        status: "INTERNAL_SERVER_ERROR",
        message: "Internal server error during logout",
      };
    }
  });
