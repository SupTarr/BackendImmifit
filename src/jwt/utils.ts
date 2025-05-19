import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import config from "../configs/config.js";

export const jwtAccessSetup = new Elysia({
  name: "jwtAccess",
}).use(
  jwt({
    name: "jwtAccess",
    schema: t.Object({
      userId: t.String(),
      roles: t.Array(t.Number()),
      username: t.String(),
      email: t.String(),
    }),
    secret: config.accessTokenSecret,
    exp: "15m",
  }),
);

export const jwtRefreshSetup = new Elysia({
  name: "jwtRefresh",
}).use(
  jwt({
    name: "jwtRefresh",
    schema: t.Object({
      userId: t.String(),
    }),
    secret: config.refreshTokenSecret,
    exp: "1d",
  }),
);

export const setJwtAndCookie = async ({
  jwtAccess,
  jwtRefresh,
  cookie,
  user,
}: any) => {
  const accessToken = await jwtAccess.sign({
    userId: user.userId,
    username: user.username,
    email: user.email,
    roles: user.roles,
  });

  const newRefreshToken = await jwtRefresh.sign({
    userId: user.userId,
  });

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
};
