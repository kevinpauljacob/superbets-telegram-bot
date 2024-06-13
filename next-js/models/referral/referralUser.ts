import mongoose, { Schema } from "mongoose";

const ReferralUserSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
      unique: true,
    },
    campaigns: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "ReferralCampaign",
        },
      ],
      default: [],
    },
    referredByChain: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "ReferralCampaign",
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
  },
  { timestamps: true },
);

const ReferralUser =
  mongoose.models.ReferralUser ||
  mongoose.model("ReferralUser", ReferralUserSchema);

export default ReferralUser;
