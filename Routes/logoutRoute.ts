import express, { Router } from "express";
import * as logoutController from "../Controllers/logoutController.js";

const logoutRoutes: Router = express.Router();

logoutRoutes.get("/", logoutController.handleLogout as any);

export default logoutRoutes;
