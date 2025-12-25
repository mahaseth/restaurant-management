import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  billNumber: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      amount: { type: Number, required: true },
      modifiers: [{ type: String }]
    }
  ],
  tableNumber: { type: Number },
  orderType: {
    type: String,
    enum: ["DINE_IN", "TAKEAWAY", "DELIVERY"], // Add all allowed values
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["CASH", "CARD", "KHALTI", "ESEWA"], // Add all allowed payment methods
    required: true
  },
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  vatPercent: { type: Number, default: 0 },
  vatAmount: { type: Number, default: 13 },
  serviceChargePercent: { type: Number, default: 0 },
  serviceChargeAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  returnAmount: { type: Number, default: 0 },
   status: {
    type: String,
    enum: ["unpaid", "pending", "completed", "paid"], // add "paid"
    default: "unpaid"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Bill", billSchema);
