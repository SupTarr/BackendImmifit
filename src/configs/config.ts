import { ConnectOptions } from "mongoose";

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

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) { // No value and no default means it's required
    throw new Error(`Missing essential environment variable: ${key}. Please ensure it is set.`);
  }
  return value || defaultValue!; // Use non-null assertion if defaultValue is guaranteed by logic
};

const config: Config = {
  // PORT can have a default
  port: getEnvVar("PORT", "3000"),
  // Secrets are critical
  accessTokenSecret: getEnvVar("ACCESS_TOKEN_SECRET"),
  refreshTokenSecret: getEnvVar("REFRESH_TOKEN_SECRET"),
  mongo: {
    uri: getEnvVar("MONGO_URI"),
    options: {
      user: process.env.MONGO_USER, // Optional, might be in URI
      pass: process.env.MONGO_PASSWORD, // Optional, might be in URI
      dbName: getEnvVar("MONGO_DATABASE"), // Database name is crucial
      retryWrites: true,
      w: "majority",
    } as ConnectOptions,
  },
};

export default config;
