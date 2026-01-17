import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bill",
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  method: {
    type: String,
    enum: ["CASH", "ESEWA", "KHALTI", "CARD"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  providerRef: String,
  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    required: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
  type: Date,
  required: true,

  }

  
});

export default mongoose.model("Payment", paymentSchema);
