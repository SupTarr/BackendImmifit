import { app } from "./api/index.js";
import mongoose, { ConnectOptions } from "mongoose";
import config from "./configs/config.js";

if (!config.isVercel) {
  mongoose
    .connect(config.mongoUri, config.mongoOptions as ConnectOptions)
    .then(() => {
      console.log("MongoDB Connected successfully (local)");
      app.listen(config.port, () => {
        console.log(`Express server listening on port ${config.port}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB Connection Error (local):", error);
      process.exit(1);
    });
} else {
  console.log(
    "Running in Vercel environment, DB connection handled per request.",
  );
}
