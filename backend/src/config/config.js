import dotenv from "dotenv";

dotenv.config();

const config = {
  appUrl: process.env.APP_URL || "",
  name: process.env.NAME || "",
  port: process.env.PORT || 5000,
  version: process.env.VERSION || "",
  jwtSecret: process.env.JWT_SECRET || "",
  feature: {
    admin: {
      enabled: parseInt(process.env.FEATURE_ADMIN_ENABLED) || false,
    },
  },
  mongodbUrl: process.env.MONGODB_URL || "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  emailApiKey: process.env.EMAIL_API_KEY || "",
};

export default config;
