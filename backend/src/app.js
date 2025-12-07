import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { homeRouter } from "./routes/home.routes.js";

dotenv.config();


const app = express();
mongoose.connect("mongodb://localhost:27017").then(() => {console.log("Connected to MongoDB")}).catch((err) => {console.error("Failed to connect to MongoDB", err)});    

app.use(cors());
app.use(express.json());
app.use("/", homeRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
