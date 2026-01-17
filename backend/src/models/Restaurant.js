import mongoose from "mongoose";

const restaurantSchema = mongoose.Schema({
  name: {
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
    },
  },
  subscriptionPlan: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED"],
    default: "ACTIVE",
  },
  panNumber: {
    type: String,
    trim: true,
  },
  registrationNumber: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    immutable: true,
  },
});

const model = mongoose.model("Restaurant", restaurantSchema);

export default model;