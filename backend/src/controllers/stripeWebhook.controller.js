import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Bill from "../models/Bill.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;

    const payment = await Payment.findOne({ providerRef: intent.id });
    if (!payment) return res.json({});

    payment.status = "SUCCESS";
    await payment.save();

    const bill = await Bill.findById(payment.billId);
    bill.status = "PAID";
    bill.paymentMethod = "CARD";
    bill.paidAmount = bill.totalAmount;
    await bill.save();
  }

  res.json({ received: true });
};
