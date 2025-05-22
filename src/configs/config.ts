import { ConnectOptions } from "mongoose";
import { Config } from "./model";

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(
      `Missing essential environment variable: ${key}. Please ensure it is set.`,
    );
  }

  return value || defaultValue!;
};

const config: Config = {
  port: getEnvVar("PORT", "3000"),
  accessTokenSecret: getEnvVar("ACCESS_TOKEN_SECRET"),
  refreshTokenSecret: getEnvVar("REFRESH_TOKEN_SECRET"),
  mongo: {
    uri: getEnvVar("MONGO_URI"),
    options: {
      user: getEnvVar("MONGO_USER"),
      pass: getEnvVar("MONGO_PASSWORD"),
      dbName: getEnvVar("MONGO_DATABASE"),
      retryWrites: true,
      w: "majority",
    } as ConnectOptions,
  },
  cloudinary: {
    name: getEnvVar("CLOUDINARY_NAME"),
    key: getEnvVar("CLOUDINARY_KEY"),
    secret: getEnvVar("CLOUDINARY_SECRET"),
  },
};

export default config;
