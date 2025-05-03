import express, { Router } from "express";
import * as userController from "../Controllers/userController.js";

const userRoutes: Router = express.Router();

userRoutes.get("/:user_id", userController.getUserById as any);
userRoutes.post("/profile", userController.addUserProfile as any);

export default userRoutes;
