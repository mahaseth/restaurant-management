import crypto from "crypto";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

export const initiateEsewaQR = async (req, res) => {
  const bill = await Bill.findById(req.params.billId);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  const referenceId = `BILL_${bill.billNumber}_${Date.now()}`;

  await Payment.create({
    billId: bill._id,
    restaurantId: bill.restaurantId,
    method: "ESEWA",
    amount: bill.totalAmount,
    providerRef: referenceId,
    status: "FAILED",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  const esewaQRData = {
    amt: bill.totalAmount,
    psc: 0,
    pdc: 0,
    txAmt: 0,
    tAmt: bill.totalAmount,
    pid: referenceId,
    scd: process.env.ESEWA_MERCHANT_CODE
  };

  res.json({
    method: "ESEWA",
    qrPayload: esewaQRData
  });
};
export const verifyEsewaPayment = async (req, res) => {
  const { oid, amt, refId } = req.body;

  const payment = await Payment.findOne({ providerRef: oid });
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  payment.status = "SUCCESS";
  await payment.save();

  const bill = await Bill.findById(payment.billId);
  bill.status = "PAID";
  bill.paymentMethod = "ESEWA";
  bill.paidAmount = amt;
  await bill.save();

  res.json({
    message: "Esewa payment success",
    pdfUrl: `/api/public/bills/${bill._id}/pdf`
  });
};
