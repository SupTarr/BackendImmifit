import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from './configs/config.js';
import dotenv from 'dotenv';
import authRoutes from './auth/controller.js';
import userRoutes from './user/controller.js';
import activitiesRoutes from './activities/controller.js';
import { verifyJWT } from './middleware/auth.middleware.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Immifit API',
      version: '1.0.0',
      description: 'API documentation for Immifit backend',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4001}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/**/*.ts'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Database connection middleware
app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(
        config.mongoUri,
        config.mongoOptions as mongoose.ConnectOptions,
      );
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB Connection Error:', error);
      return res.status(500).json({ message: 'Internal Server Error: DB Connection Failed' });
    }
  }
  next();
});

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/user', verifyJWT, userRoutes);
app.use('/activities', verifyJWT, activitiesRoutes);

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'SUCCESS' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error caught:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.message,
    });
  }

  return res.status(500).json({
    status: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'NOT_FOUND',
    message: 'Route not found',
  });
});

if (!config.isVercel && typeof process !== 'undefined' && process.version) {
  const port = process.env.PORT || 4001;
  try {
    app.listen(port, () => {
      console.log(`🚀 Express server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

export default app;
