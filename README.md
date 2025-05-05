# Immifit API - Backend Service

## Overview

The Immifit API is the backend service for the Immifit application, built using the Elysia.js framework and MongoDB. It handles user authentication, profile management, and activity tracking.

## Features

- **Authentication**: Secure user registration, login, JWT-based session management (access and refresh tokens), and logout.
- **User Management**: Retrieve user details.
- **Profile Management**: Create and update user profiles, including automatic BMI calculation based on height and weight.
- **Activity Tracking**: CRUD operations for user activities (Running, Cycling, Swimming, etc.), including image uploads to Cloudinary.
- **Validation**: Request body and parameter validation using Elysia's built-in validation.
- **CORS**: Configured Cross-Origin Resource Sharing for specific allowed origins.
- **Environment-Aware**: Supports running locally via Node.js/Bun and deployment to Vercel (using `app.fetch`).

## Technologies

- **Framework**: [Elysia.js](https://elysiajs.com/)
- **Language**: TypeScript
- **Database**: MongoDB with [Mongoose](https://mongoosejs.com/) ODM
- **Authentication**: JSON Web Tokens ([jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)), [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing
- **Image Storage**: [Cloudinary](https://cloudinary.com/)
- **Runtime**: Node.js / Bun / Vercel
- **Environment Variables**: [dotenv](https://github.com/motdotla/dotenv)
- **Validation**: Elysia's built-in TypeBox validation

## Prerequisites

- Node.js (v22.x recommended, see `package.json`) or Bun
- npm, yarn, or pnpm
- MongoDB instance (local or cloud-based like MongoDB Atlas)
- Cloudinary account

## Installation

1. **Clone the repository:**

```bash
git clone <your-repository-url>
cd BackendImmifit
```

2. **Install dependencies:**

```bash
npm install
# or yarn install / pnpm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory by copying `.env.example` (if provided) or creating it manually. Fill in the required values:

```dotenv
# MongoDB
MONGO_URI=your_mongodb_connection_string
MONGO_USER=your_mongodb_user # Optional, depending on connection string/options
MONGO_PASSWORD=your_mongodb_password # Optional
MONGO_DATABASE=your_mongodb_database_name

# JWT Secrets
ACCESS_TOKEN_SECRET=your_strong_access_token_secret
REFRESH_TOKEN_SECRET=your_strong_refresh_token_secret

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET=your_cloudinary_api_secret

# Server
PORT=4001 # Default port for local development

# Deployment (Set to true if deploying to Vercel)
IS_VERCEL=false
```

## Running the Application

### Local Development (using Bun)

The project is configured to use Bun for development with hot-reloading:

```bash
bun run dev
```
