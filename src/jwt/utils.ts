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
