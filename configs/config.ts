import dotenv from "dotenv";
import { ConnectOptions } from "mongoose";

dotenv.config();

const config = {
  port: process.env.PORT || 4001,
  mongoUri: process.env.MONGO_URI as string,
  mongoOptions: {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
    dbName: process.env.MONGO_DATABASE,
    retryWrites: true,
    w: "majority",
  } as ConnectOptions,
  isVercel: process.env.IS_VERCEL === "true",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
};

export default config;
