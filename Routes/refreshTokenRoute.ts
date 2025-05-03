import express, { Router } from "express";
import * as refreshTokenController from "../Controllers/refreshTokenController.js";

const refreshTokenRoutes: Router = express.Router();

refreshTokenRoutes.get("/", refreshTokenController.handleRefreshToken as any);

export default refreshTokenRoutes;
