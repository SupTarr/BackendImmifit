import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "../configs/config.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

if (config.isVercel) {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mongoose.connect(
        config.mongoUri,
        config.mongoOptions as mongoose.ConnectOptions,
      );
      console.log("Connected to MongoDB");
      next();
    } catch (error) {
      console.error("MongoDB Connection Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });
}

app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  }),
);

import activityRoutes from "../Routes/activitiesRoute.js";
app.use("/activities", activityRoutes);

import userRoutes from "../Routes/userRoute.js";
app.use("/users", userRoutes);

import authRoutes from "../Routes/authRoute.js";
app.use("/auth", authRoutes);

import refreshTokenRoutes from "../Routes/refreshTokenRoute.js";
app.use("/refresh", refreshTokenRoutes);

import logoutRoutes from "../Routes/logoutRoute.js";
app.use("/logout", logoutRoutes);

export { app };
