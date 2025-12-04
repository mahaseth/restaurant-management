import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { homeRouter } from "./routes/home.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", homeRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
