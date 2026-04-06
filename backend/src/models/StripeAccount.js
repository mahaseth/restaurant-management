import mongoose from "mongoose";

const stripeAccountSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true,
    },
    stripeAccountId: {
      type: String,
      required: true,
      trim: true,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    chargesEnabled: {
      type: Boolean,
      default: false,
    },
    payoutsEnabled: {
      type: Boolean,
      default: false,
    },
    detailsSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const StripeAccount = mongoose.model("StripeAccount", stripeAccountSchema);

export default StripeAccount;
