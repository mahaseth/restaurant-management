import mongoose from "mongoose";
import config from "./config.js";

async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUrl);
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

export default connectDB;
