import { Elysia } from "elysia";
import User, { IUser } from "./model.js";
import { LoginBodySchema, RegisterBodySchema } from "./model.js";
import { RefreshTokenPayload } from "../jwt/model.js";
import {
  jwtAccessSetup,
  jwtRefreshSetup,
  setJwtAndCookie,
} from "../jwt/utils.js";

export const authPlugin = new Elysia({ prefix: "/auth" })
  .use(jwtAccessSetup)
  .use(jwtRefreshSetup)
  .post(
    "/login",
    async ({ body, jwtAccess, jwtRefresh, cookie, set }) => {
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

      const match = await Bun.password.verify(password, foundUser.password);
      if (!match) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid email or password",
        };
      }

      const accessToken = await setJwtAndCookie({
        jwtAccess,
        jwtRefresh,
        cookie,
        user: foundUser,
      });

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
        set.status = 400;
        return { status: "INVALID_REQUEST", message: "Email already exists" };
      }

      const duplicateUsername = await User.findOne({
        username: username,
      }).exec();
      if (duplicateUsername) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Username already exists",
        };
      }

      try {
        const userId = "USER:" + crypto.randomUUID();
        const hashedPwd = await Bun.password.hash(password, {
          algorithm: "bcrypt",
          cost: 10,
        });

        const newUser = await User.create({
          userId,
          email,
          username,
          password: hashedPwd,
          roles: [1000],
        } as Partial<IUser>);

        set.status = 201;
        return {
          status: "SUCCESS",
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

  .post("/refresh", async ({ jwtAccess, jwtRefresh, cookie, set }) => {
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

      let decoded = (await jwtRefresh.verify(refreshToken)) as
        | RefreshTokenPayload
        | false;
      if (!decoded) {
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Invalid refresh token",
        };
      }

      if (foundUser.userId !== decoded.userId) {
        cookie.jwt.remove();
        set.status = 400;
        return {
          status: "INVALID_REQUEST",
          message: "Refresh token mismatch",
        };
      }

      const accessToken = await setJwtAndCookie({
        jwtAccess,
        jwtRefresh,
        cookie,
        user: foundUser,
      });

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
