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
    pan: {
      type: String,
      required: [true, "PAN is required."],
    },
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