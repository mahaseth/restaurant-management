import express from "express";
import bodyParser from "body-parser";
import config from "./config/config.js";
import { homeRouter } from "./routes/home.routes.js";
import userRoute from "./routes/user.routes.js";
import authRoute from "./routes/auth.routes.js";
import connectDB from "./config/database.js";
import auth from "./middlewares/auth.js";
import logger from "./middlewares/logger.js";
import roleBasedAuth from "./middlewares/roleBasedAuth.js";
import { ROLE_ADMIN } from "./constants/roles.js";
import billRoutes from "./routes/bill.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import tableRoutes from "./routes/table.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import multer from "multer";
import connectCloudinary from "./config/cloudinary.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

connectDB();
connectCloudinary();

app.use(bodyParser.json());
app.use(logger);

app.use("/", homeRouter);
app.use("/api/users", auth, upload.single("image"), userRoute);
app.use("/api/auth", authRoute);
app.use('/api/bill', billRoutes);
app.use('/api/menuitems', menuRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/tables', auth, tableRoutes);
app.use('/api/restaurant', auth, restaurantRoutes);

app.listen(config.port, () => {
  console.log(`Server is running at port: ${config.port}...`);
});
