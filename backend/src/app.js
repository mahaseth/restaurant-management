import express from "express";
import bodyParser from "body-parser";
import config from "./config/config.js";
import { homeRouter } from "./routes/home.routes.js";
import userRoute from "./routes/user.routes.js";
import connectDB from "./config/database.js";


const app = express();
connectDB();   
app.use(bodyParser.json());

app.use("/", homeRouter);
app.use("/api/users", userRoute);

app.listen(config.port, () => {
  console.log(`Server is running at port: ${config.port}...`);
});
