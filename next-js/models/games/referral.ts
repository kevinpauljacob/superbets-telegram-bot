import mongoose, { Schema, Document } from "mongoose";

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
      required: true,
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

interface IReferral extends Document {
  wallet: string;
  referralCode: string;
  referredByChain: Schema.Types.ObjectId[];
  volume: (typeof AmountSchema)[];
  totalEarnings: (typeof AmountSchema)[];
  unclaimedEarnings: (typeof AmountSchema)[];
}

const Referral =
  mongoose.models.Referral ||
  mongoose.model<IReferral>("Referral", ReferralSchema);

export default Referral;
