// backend/src/models/Restaurant.js
import mongoose from "mongoose";
import { int } from "zod";

const restaurantSchema = mongoose.Schema({
  res_name: {
    type: String,
    required: true,
   
  },
  phoneNo:{
    type: String,
    required: true,
    trim: true,
  },
  
  address: {
    city: {
      type: String,
      required: [true, "Address city is required."],
    },
    province: {
      type: String,
      required: [true, "Address province is required."],
    },
    street: String,
    country: {
      type: String,
      default: "Nepal",
      required: true,
    },
  
   
  },
  
      panNo: {
    type: String,
    trim: true,
    default: ""
  },
  
  regNo: {
    type: String,
    trim: true,
    default: ""
  },
  subscriptionPlan: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED"],
    default: "ACTIVE",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
});

const model = mongoose.model("Restaurant", restaurantSchema);

export default model;