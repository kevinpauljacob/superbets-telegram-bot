import mongoose, { Schema } from "mongoose";

const ReferralCampaignSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    campaignName: {
      type: String,
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
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

ReferralCampaignSchema.index({ wallet: 1, campaignName: 1 }, { unique: true });

const ReferralCampaign =
  mongoose.models.ReferralCampaign ||
  mongoose.model("ReferralCampaign", ReferralCampaignSchema);

export default ReferralCampaign;
