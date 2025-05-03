import express, { Router } from "express";
import * as userController from "../Controllers/userController.js";
import * as profileController from "../Controllers/profileController.js";

const userRoutes: Router = express.Router();

userRoutes.get("/", userController.getAllUsers as any);
userRoutes.get("/:user_id", userController.getUserById as any);
userRoutes.post("/", userController.createUser as any);
userRoutes.post("/profile", profileController.addUserProfile as any);

export default userRoutes;
