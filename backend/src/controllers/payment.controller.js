import Bill from "../models/Bill.js";

export const payBill = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const bill = await Bill.findById(req.params.id);

    if (!bill) return res.status(404).json({ error: "Bill not found" });

    bill.paidAmount += amount;
    bill.returnAmount = bill.totalAmount - bill.paidAmount;

    if (bill.returnAmount <= 0) {
      bill.status = "paid";
      bill.returnAmount = 0;
    } else {
      bill.status = "partial";
    }

    await bill.save();
    res.json(bill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
};
