import mongoose, { Schema } from "mongoose";

const ReferralCampaignSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReferralUser",
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
    signupCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

ReferralCampaignSchema.index({ account: 1, campaignName: 1 }, { unique: true });

const ReferralCampaign =
  mongoose.models.ReferralCampaign ||
  mongoose.model("ReferralCampaign", ReferralCampaignSchema);

export default ReferralCampaign;
