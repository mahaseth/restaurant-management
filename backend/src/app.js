import express from "express";
import bodyParser from "body-parser";
import config from "./config/config.js";
import { homeRouter } from "./routes/home.routes.js";
import userRoute from "./routes/user.routes.js";
import authRoute from "./routes/auth.routes.js";
import connectDB, { startMongoReconnectLoop } from "./config/database.js";
import auth from "./middlewares/auth.js";
import logger from "./middlewares/logger.js";
import roleBasedAuth from "./middlewares/roleBasedAuth.js";
import { ROLE_ADMIN } from "./constants/roles.js";
import billRoutes from "./routes/bill.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import tableRoutes from "./routes/table.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import publicRoutes from "./routes/public.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import aiStudioRoutes from "./features/ai-studio/aiStudio.routes.js";
import multer from "multer";
import connectCloudinary from "./config/cloudinary.js";
import cors from "cors";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const isProd = process.env.NODE_ENV === "production";

try {
  try {
    await connectDB();
  } catch {
    if (isProd && process.env.ALLOW_START_WITHOUT_DB !== "true") {
      console.error(
        "Refusing to start without database in production. Set ALLOW_START_WITHOUT_DB=true to override."
      );
      process.exit(1);
    }
    console.warn(
      "Starting API without MongoDB; DB routes will fail until connected. Retrying in the background."
    );
    startMongoReconnectLoop();
  }
  connectCloudinary();

  // Stripe webhook must receive the raw body for signature verification.
  // This route must be registered BEFORE express.json() / bodyParser.json().
  app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" })
  );

  app.use(bodyParser.json());
  app.use(logger);
  app.use(cors());

  app.use("/", homeRouter);
  app.use("/api/public", publicRoutes);
  app.use("/api/users", auth, upload.single("image"), userRoute);
  app.use("/api/auth", authRoute);
  app.use('/api/bill', billRoutes);
  app.use('/api/menuitems', menuRoutes);
  app.use('/api/order', orderRoutes);
  app.use('/api/tables', auth, tableRoutes);
  app.use('/api/restaurant', auth, restaurantRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use("/api/ai-studio", auth, upload.single("image"), aiStudioRoutes);

  // Bind on all interfaces so the API is reachable from your phone over Wi-Fi
  // (e.g. http://192.168.x.x:5000). This also avoids some localhost IPv4/IPv6 quirks.
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server is running at port: ${config.port}...`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
  process.exit(1);
}
