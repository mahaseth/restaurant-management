import Payment from "../models/Payment.js";

export const checkPaymentStatus = async (req, res) => {
  const { billId } = req.params;

  const payment = await Payment.findOne({ billId }).sort({ paidAt: -1 });
  if (!payment) {
    return res.json({ status: "PENDING" });
  }
  if (payment && payment.status === "FAILED" && payment.expiresAt < new Date()) {
  return res.json({ status: "EXPIRED" });
}


  res.json({
    status: payment.status,
    method: payment.method
  });
};
