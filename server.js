import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import auth from "./route/auth.route.js";
import admin from "./route/admin.route.js";
import face from "./route/face.route.js";
import errorMiddleware from "./middleware/error.middleware.js";
import logger from "./utils/logger.js";
import morgan from "morgan";

dotenv.config();
const app = express();

await connectDB();
app.use(morgan("dev"));

app.use(cors());
app.use(express.json());

app.use("/api/v1/admin/", admin);
app.use("/api/v1/auth/", auth);
app.use("/api/v1/face/", face);

app.use("", errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port http://localhost:${PORT}`);
});
