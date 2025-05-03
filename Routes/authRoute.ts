import express, { Router } from "express";
import * as authController from "../Controllers/authController.js";

const authRoutes: Router = express.Router();

authRoutes.post("/", authController.handleLogin as any);

export default authRoutes;
