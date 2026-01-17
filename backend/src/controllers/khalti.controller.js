import axios from "axios";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

export const initiateKhaltiQR = async (req, res) => {
  const bill = await Bill.findById(req.params.billId);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  const response = await axios.post(
    "https://a.khalti.com/api/v2/epayment/initiate/",
    {
      return_url: "https://yourdomain.com/api/payments/khalti/verify",
      website_url: "https://yourdomain.com",
      amount: bill.totalAmount * 100,
      purchase_order_id: bill.billNumber,
      purchase_order_name: "Restaurant Bill"
    },
    {
      headers: {
        Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`
      }
    }
  );

  await Payment.create({
    billId: bill._id,
    restaurantId: bill.restaurantId,
    method: "KHALTI",
    amount: bill.totalAmount,
    providerRef: response.data.pidx,
    status: "FAILED",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  res.json({
    method: "KHALTI",
    qrUrl: response.data.qr_url
  });
};
export const verifyKhaltiPayment = async (req, res) => {
  const { pidx } = req.body;

  const payment = await Payment.findOne({ providerRef: pidx });
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  payment.status = "SUCCESS";
  await payment.save();

  const bill = await Bill.findById(payment.billId);
  bill.status = "PAID";
  bill.paymentMethod = "KHALTI";
  bill.paidAmount = bill.totalAmount;
  await bill.save();

  res.json({
    message: "Khalti payment success",
    pdfUrl: `/api/public/bills/${bill._id}/pdf`
  });
};
