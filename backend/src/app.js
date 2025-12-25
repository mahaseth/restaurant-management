import express from "express";
import bodyParser from "body-parser";
import config from "./config/config.js";
import { homeRouter } from "./routes/home.routes.js";
import userRoute from "./routes/user.routes.js";
import authRoute from "./routes/auth.routes.js";
import connectDB from "./config/database.js";
import auth from "./middlewares/auth.js";
import logger from "./middlewares/logger.js";
import billRoutes from "./routes/bill.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import multer from "multer";
import connectCloudinary from "./config/cloudinary.js";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: "*" }
});

const upload = multer({ storage: multer.memoryStorage() });

connectDB();
connectCloudinary();

app.use(bodyParser.json());
app.use(logger);

app.use("/", homeRouter);
app.use("/api/users", auth, upload.single("image"), userRoute);
app.use("/api/auth", authRoute);
app.use("/api/bills", billRoutes);
app.use("/api/menuitems", menuRoutes);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
});

server.listen(config.port, () => {
  console.log(`Server is running at port: ${config.port}...`);
});
