import { ConnectOptions } from "mongoose";

export interface BaseConfig {
  port: number | string;
  accessTokenSecret: string;
  refreshTokenSecret: string;
}

export interface MongoDBConfig {
  uri: string;
  options?: ConnectOptions;
}

export interface CloudinaryConfig {
  name: string;
  key: string;
  secret: string;
}

export interface Config extends BaseConfig {
  mongo: MongoDBConfig;
  cloudinary: CloudinaryConfig;
}
