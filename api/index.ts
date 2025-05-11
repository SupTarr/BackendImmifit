import { Elysia, Context } from "elysia";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import mongoose from "mongoose";
import config from "../configs/config.js";
import dotenv from "dotenv";
import { authPlugin } from "../auth/controller.js";
import { userPlugin } from "../user/controller.js";
import { activitiesPlugin } from "../activities/controller.js";

dotenv.config();
const app = new Elysia()
  .onRequest(async ({ set, request }) => {
    if (request.method === "OPTIONS") {
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(
          config.mongoUri,
          config.mongoOptions as mongoose.ConnectOptions,
        );
        console.log("Connected to MongoDB");
      } catch (error) {
        console.error("MongoDB Connection Error:", error);
        set.status = 500;
        return "Internal Server Error: DB Connection Failed";
      }
    }
  })
  .use(
    cors({
      origin: "https://immifit.suptarr.vercel.app",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "application/json"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .options("/*", ({ set }) => {
    set.status = 200;
    return "";
  })
  .use(swagger())
  .use(cookie())
  .use(authPlugin)
  .use(userPlugin)
  .use(activitiesPlugin)
  .onError(({ code, error, set }) => {
    console.error(`Error caught: ${code}`, error);
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { status: "NOT_FOUND", message: "Route not found" };
    } else if (code === "VALIDATION") {
      set.status = 400;
      return {
        status: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.message,
      };
    } else if (code === "INTERNAL_SERVER_ERROR") {
      set.status = 500;
      return {
        status: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      };
    }

    set.status = 500;
    return {
      status: "UNKNOWN_ERROR",
      message: "message" in error ? error.message : "An unknown error occurred",
    };
  })
  .get("/health", () => ({ status: "SUCCESS" }));

if (!config.isVercel && typeof process !== "undefined" && process.version) {
  const port = process.env.PORT || 4001;
  try {
    app.listen(port, () => {
      console.log(`🦊 Elysia is running locally at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

export default app.fetch;
export { app };
