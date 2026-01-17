// backend/src/models/Bill.js
import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true
  },
  billNumber: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  restaurantname: { type: String, required: true },
  restaurantaddress: { type: String, required: true },
  restaurantphone: { type: String, required: true },
   panNo: { type: String, required: true },
   regNo: { type: String, required: true },
  items: [
    {
      name: String,
      quantity: Number,
      rate: Number,
      amount: Number,
      modifiers: [String]
    }
  ],
  tableNumber: Number,
  orderType: {
    type: String,
    enum: ["DINE_IN", "TAKEAWAY", "DELIVERY"],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["CASH", "CARD", "KHALTI", "ESEWA"],
    required: true
  },
  subtotal: Number,
  discountAmount: { type: Number, default: 0 },
  vatPercent: { type: Number, default: 13 },
  vatAmount: { type: Number, default: 0 },
  serviceChargePercent: { type: Number, default: 0 },
  serviceChargeAmount: { type: Number, default: 0 },
  totalAmount: Number,
  paidAmount: Number,
  returnAmount: Number,
  status: {
    type: String,
    enum: ["paid"],
    default: "paid"
  },
  createdAt: { type: Date, default: Date.now }
});


const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema)
export default Bill;

