import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

export const initiatePayment = async (req, res) => {
  const { method } = req.body;

  const bill = await Bill.findById(req.params.billId);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  if (bill.status === "PAID") {
    return res.status(400).json({ message: "Bill already paid" });
  }

  if (method === "CASH") {
    const payment = await Payment.create({
      billId: bill._id,
      restaurantId: bill.restaurantId,
      method: "CASH",
      amount: bill.totalAmount,
      status: "SUCCESS"
    });

    bill.paidAmount = bill.totalAmount;
    bill.paymentMethod = "CASH";
    bill.status = "PAID";
    await bill.save();

    return res.json({
      message: "Cash payment completed",
      bill,
      payment
    });
  }

  if (method === "ESEWA") {
    return res.json({
      redirectUrl: "ESEWA_PAYMENT_URL",
      billId: bill._id
    });
  }

  if (method === "KHALTI") {
    return res.json({
      pidx: "KHALTI_PID",
      billId: bill._id
    });
  }

  if (method === "CARD") {
    return res.json({
      clientSecret: "STRIPE_CLIENT_SECRET",
      billId: bill._id
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { billId, method, amount, providerRef } = req.body;

  const bill = await Bill.findById(billId);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  await Payment.create({
    billId: bill._id,
    restaurantId: bill.restaurantId,
    method,
    amount,
    providerRef,
    status: "SUCCESS"
  });

  bill.paidAmount = amount;
  bill.paymentMethod = method;
  bill.status = "PAID";
  await bill.save();

  res.json({
    message: "Payment verified",
    pdfUrl: `/api/public/bills/${bill._id}/pdf`
  });
};
