import mongoose, { Schema } from "mongoose";

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
    referredByChain: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Referral",
        },
      ],
      default: [],
    },
    volume: {
      type: Map,
      of: Number,
      default: {},
    },
    feeGenerated: {
      type: Map,
      of: Number,
      default: {},
    },
    totalEarnings: {
      type: Map,
      of: Number,
      default: {},
    },
    unclaimedEarnings: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

const Referral =
  mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

export default Referral;
