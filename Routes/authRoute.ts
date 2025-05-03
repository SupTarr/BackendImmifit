import express, { Router } from "express";
import * as authController from "../Controllers/authController.js";

const authRoutes: Router = express.Router();

authRoutes.post("/login", authController.handleLogin as any);
authRoutes.post("/register", authController.handleRegister as any);
authRoutes.post("/refresh", authController.handleRefreshToken as any);
authRoutes.get("/logout", authController.handleLogout as any);

export default authRoutes;
