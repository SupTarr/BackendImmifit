import { Elysia, Static } from "elysia";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateAndSetTokens } from "./token.js";
import User, { IUser } from "../models/userModel.js";
import {
  LoginBodySchema,
  RegisterBodySchema,
  RefreshTokenPayload,
  AuthContext,
} from "./model.js";

type LoginBodyType = Static<typeof LoginBodySchema>;

export const authPlugin = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({
      body,
      access,
      refresh,
      cookie,
      set,
    }: { body: LoginBodyType } & AuthContext) => {
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
      if (!match) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid email or password",
        };
      }

      const accessToken = await generateAndSetTokens(
        access,
        refresh,
        cookie,
        foundUser,
      );
      set.status = 200;
      return { status: "SUCCESS", body: { accessToken } };
    },
    { body: LoginBodySchema },
  )

  .post(
    "/register",
    async ({ body, set }) => {
      const { email, username, password } = body;
      const duplicateEmail = await User.findOne({ email: email }).exec();
      if (duplicateEmail) {
        set.status = 409;
        return { status: "INVALID_REQUEST", message: "Email already exists" };
      }

      try {
        const userId = "USER:" + uuidv4();
        const hashedPwd = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          userId: userId,
          email: email,
          username: username,
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

  .post("/refresh", async ({ access, refresh, cookie, set }: AuthContext) => {
    const refreshToken = cookie.jwt.value;
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
        return {
          status: "INVALID_REQUEST",
          message: "Invalid refresh token",
        };
      }

      const decoded = (await refresh.verify(
        refreshToken,
      )) as RefreshTokenPayload;

      if (foundUser.userId !== decoded.userId) {
        cookie.jwt.remove();
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Refresh token mismatch",
        };
      }

      const accessToken = await generateAndSetTokens(
        access,
        refresh,
        cookie,
        foundUser,
      );
      set.status = 200;
      return { status: "SUCCESS", body: { accessToken } };
    } catch (error) {
      console.error("Error handling refresh token:", error);
      cookie.jwt.remove();
      set.status = 500;
      return {
        status: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh token",
      };
    }
  })

  .post("/logout", async ({ cookie, set }) => {
    const refreshToken = cookie.jwt.value;
    if (!refreshToken || typeof refreshToken !== "string") {
      set.status = 200;
      return { status: "SUCCESS" };
    }

    try {
      await User.updateOne({ refreshToken: "" });
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
