import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import mongoose from "mongoose";
import config from "./configs/config.js";
import { authPlugin } from "./auth/controller.js";
import { userPlugin } from "./users/controller.js";
import { activitiesPlugin } from "./activities/controller.js";

const connectDB = async () => {
  try {
    const mongoOptions = config.mongo.options as mongoose.ConnectOptions;
    await mongoose.connect(config.mongo.uri, mongoOptions);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit process with failure
  }
};

const app = new Elysia()
  .use(
    cors({
      origin: "https://immifit.suptarr.vercel.app",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    }),
  )
  .use(swagger())
  .use(cookie())
  .use(logger())
  .use(authPlugin)
  .use(userPlugin)
  .use(activitiesPlugin)
  .onError(({ code, error, set }) => {
    console.error(`Error Code: ${code}, Error Message: ${error.message}, Stack: ${error.stack}`); // Log detailed error server-side

    let statusCode = 500;
    let errorCode = "INTERNAL_SERVER_ERROR";
    let errorMessage = "An unexpected internal server error occurred. Please try again later.";

    // Elysia specific error handling (example for validation)
    // Error types can be 'VALIDATION', 'NOT_FOUND', 'PARSE', 'INTERNAL_SERVER_ERROR', 'UNKNOWN'
    if (error.type) { // Check if error.type is available (Elysia standard error object)
      switch (error.type) {
        case 'VALIDATION':
          statusCode = 400; // Bad Request
          errorCode = 'VALIDATION_ERROR';
          // For validation errors, error.message can sometimes be user-friendly, but let's be cautious.
          // error.message often contains specifics about which field failed.
          // Consider if error.message from validation should be sent or a generic one.
          // For now, let's opt for a more generic message for all cases until further requirements.
          errorMessage = 'There was an issue with the data provided.';
          // If you want to pass more details from validation (CAREFULLY!):
          // errorMessage = error.message;
          break;
        case 'NOT_FOUND':
          statusCode = 404;
          errorCode = 'NOT_FOUND';
          errorMessage = 'The requested resource was not found.';
          break;
        case 'PARSE':
          statusCode = 400; // Bad request, e.g. invalid JSON
          errorCode = 'PARSE_ERROR';
          errorMessage = 'The request body could not be parsed.';
          break;
        // Add other cases as needed
        default:
          // For other Elysia known error types, use its status if available
          if (typeof error.status === 'number') {
            statusCode = error.status;
          }
          // errorCode could be error.type or a transformation of it
          errorCode = error.type || 'UNKNOWN_ERROR';
          // Use a generic message if not specifically handled
          errorMessage = `An error occurred: ${error.type || 'Please try again.'}`;
          break;
      }
    } else if (typeof error.status === 'number') {
      // For generic errors that might have a status property
      statusCode = error.status;
      if (statusCode === 401) {
          errorCode = 'UNAUTHORIZED';
          errorMessage = 'Authentication failed or token is invalid.';
      } else if (statusCode === 403) {
          errorCode = 'FORBIDDEN';
          errorMessage = 'You do not have permission to access this resource.';
      }
    }
    // else, it's an unexpected error, defaults (500, INTERNAL_SERVER_ERROR) will be used.

    set.status = statusCode;
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        // Optionally, for validation errors, you might include error.validator.Errors (Elysia specific)
        // details: error.type === 'VALIDATION' ? error.validator?.Errors(error.value) : undefined
      },
    };
  })
  .get("/", () => ({ status: "SUCCESS" }));

// Define a function to start the server
const startServer = async () => {
  await connectDB(); // Connect to DB before starting server

  app.listen({
    hostname: "0.0.0.0",
    port: config.port,
  });

  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
  );
};

// Initialize server
startServer();

// For potential testing or other programmatic uses, you might export the app.
// However, ensure `listen` is not called if app is imported elsewhere for testing
// without starting the server. This setup calls listen immediately via startServer.
// export { app }; // Example export
