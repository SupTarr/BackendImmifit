import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import mongoose from "mongoose";
import config from "./configs/config.js";
import { authPlugin } from "./auth/controller.js";
import { userPlugin } from "./users/controller.js";
import { activitiesPlugin } from "./activities/controller.js";

const app = new Elysia()
  .onRequest(async (ctx) => {
    if (mongoose.connection.readyState !== 1) {
      const mongoConfig = config.mongo.options as mongoose.ConnectOptions;
      const mongoUri = config.mongo.uri;
      mongoUri.replace("{username}", mongoConfig.user as string);
      mongoUri.replace("{password}", mongoConfig.pass as string);
      await mongoose.connect(mongoUri, mongoConfig);
      console.log("Connected to MongoDB");
    }
  })
  .use(
    cors({
      origin: "https://immifit.suptarr.vercel.app",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .use(swagger())
  .use(cookie())
  .use(logger())
  .use(authPlugin)
  .use(userPlugin)
  .use(activitiesPlugin)
  .onError(({ code, error, set }) => {
    console.error(`Error caught: ${code}`, error);
    if (code === 400) {
      set.status = 400;
      return { status: "INVALID_REQUEST" };
    }

    set.status = 500;
    return {
      status: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    };
  })
  .get("/", () => ({ status: "SUCCESS" }))
  .listen({
    hostname: "0.0.0.0",
    port: config.port,
  });

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
