import mongoose, { Schema } from "mongoose";

const CampaignSchema = new Schema(
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

CampaignSchema.index({ wallet: 1, campaignName: 1 }, { unique: true });

const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);

export default Campaign;
