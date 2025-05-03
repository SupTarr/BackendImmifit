import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "../configs/config.js";
import dotenv from "dotenv";
import authRoutes from "../Routes/authRoute.js";
import userRoutes from "../Routes/userRoute.js";
import activityRoutes from "../Routes/activitiesRoute.js";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const allowedOrigins = config.isVercel
  ? ['https://immifit.suptarr.vercel.app']
  : ['http://localhost:3000', 'http://localhost:4001'];

if (config.isVercel) {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(
          config.mongoUri,
          config.mongoOptions as mongoose.ConnectOptions,
        );
        console.log("Connected to MongoDB (Vercel)");
      }
      next();
    } catch (error) {
      console.error("MongoDB Connection Error (Vercel):", error);
      res.status(500).send("Internal Server Error");
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/activities", activityRoutes);

export { app };
