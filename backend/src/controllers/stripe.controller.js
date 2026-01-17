import Stripe from "stripe";
import Bill from "../models/Bill.js";
import Payment from "../models/Payment.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createStripeIntent = async (req, res) => {
  const bill = await Bill.findById(req.params.billId);
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }

  const intent = await stripe.paymentIntents.create({
    amount: bill.totalAmount * 100,
    currency: "npr",
    payment_method_types: ["card"],
    metadata: {
      billId: bill._id.toString()
    }
  });

  await Payment.create({
    billId: bill._id,
    restaurantId: bill.restaurantId,
    method: "CARD",
    amount: bill.totalAmount,
    providerRef: intent.id,
    status: "FAILED",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  res.json({
    clientSecret: intent.client_secret
  });
};
