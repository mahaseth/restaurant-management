import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

export const payBill = async (req, res) => {
  const { amount, method, receivedBy } = req.body;

  const bill = await Bill.findById(req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });

  if (bill.balanceAmount <= 0) {
    return res.status(400).json({ error: "Bill already paid" });
  }

  await Payment.create({
    billId: bill._id,
    amount,
    method,
    receivedBy
  });

  bill.paidAmount += amount;
  bill.returnAmount = bill.totalAmount - bill.paidAmount;

  if (bill.returnAmount === 0) bill.status = "paid";
  else bill.status = "partial";

  await bill.save();

  res.json(bill);
};
