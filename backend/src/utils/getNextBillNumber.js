// backend/src/utils/getNextBillNumber.js
import Counter from "../models/Counter.js";

export async function getNextBillNumber() {
  const counter = await Counter.findOneAndUpdate(
    { _id: "billNumber" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}
