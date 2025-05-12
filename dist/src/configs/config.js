import dotenv from "dotenv";
dotenv.config();
const config = {
    port: process.env.PORT || 4001,
    mongoUri: process.env.MONGO_URI,
    mongoOptions: {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
        dbName: process.env.MONGO_DATABASE,
        retryWrites: true,
        w: "majority",
    },
    isVercel: process.env.IS_VERCEL === "true",
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
};
export default config;
