import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();
const connectURI = process.env.MONGOOSE_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(connectURI);
    logger.info("DB connection successful");
  } catch (error) {
    logger.error("DB Connection Error: " + error);
  }
};

export default connectDB;
