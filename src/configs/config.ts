import dotenv from "dotenv";
import { ConnectOptions } from "mongoose";

dotenv.config();

interface BaseConfig {
  port: number | string;
  accessTokenSecret: string;
  refreshTokenSecret: string;
}

interface MongoDBConfig {
  uri: string;
  options?: ConnectOptions;
}

interface Config extends BaseConfig {
  mongo: MongoDBConfig;
}

const config: Config = {
  port: process.env.PORT || 3000,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
  mongo: {
    uri: process.env.MONGO_URI as string,
    options: {
      user: process.env.MONGO_USER,
      pass: process.env.MONGO_PASSWORD,
      dbName: process.env.MONGO_DATABASE,
      retryWrites: true,
      w: "majority",
    } as ConnectOptions,
  },
};

export default config;
