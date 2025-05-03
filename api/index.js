const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("../configs/config");

app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
require("dotenv").config();

if (config.isVercel) {
  app.use(async (req, res, next) => {
    try {
      await mongoose.connect(config.mongoUri, config.mongoOptions);
      console.log("Connected to MongoDB");
      next();
    } catch (error) {
      res.status(500).send(error);
    }
  });
}

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  })
);

const activityRoutes = require("../Routes/activitiesRoute");
app.use("/activities", activityRoutes);

const userRoutes = require("../Routes/userRoute");
app.use("/users", userRoutes);

const authRoutes = require("../Routes/authRoute");
app.use("/auth", authRoutes);

const refreshTokenRoutes = require("../Routes/refreshTokenRoute");
app.use("/refresh", refreshTokenRoutes);

const logoutRoutes = require("../Routes/logoutRoute");
app.use("/logout", logoutRoutes);

module.exports = app;
