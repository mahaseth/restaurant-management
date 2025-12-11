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


const app = express();
connectDB();
app.use(bodyParser.json());
app.use(logger);

app.use("/", homeRouter);
app.use("/api/users", auth, roleBasedAuth(ROLE_ADMIN), userRoute);
app.use("/api/auth", authRoute);
app.use('/api/bill', billRoutes);

app.listen(config.port, () => {
  console.log(`Server is running at port: ${config.port}...`);
});
