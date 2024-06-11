import mongoose, { Schema } from "mongoose";

const AmountSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  tokenMint: {
    type: String,
    required: true,
    default: "SOL",
  },
});

const ReferralSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
      unique: true,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredByChain: [
      {
        type: Schema.Types.ObjectId,
        ref: "Referral",
      },
    ],
    volume: [AmountSchema],
    totalEarnings: [AmountSchema],
    unclaimedEarnings: [AmountSchema],
  },
  { timestamps: true },
);

const Referral =
  mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

export default Referral;
