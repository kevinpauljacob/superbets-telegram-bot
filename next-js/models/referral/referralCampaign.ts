import mongoose, { Schema } from "mongoose";

const ReferralCampaignSchema = new Schema(
  {
    email: {
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
    signupCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

// ReferralCampaignSchema.pre("validate", function (next) {
//   if (!this.wallet && !this.email) {
//     next(new Error("Either wallet or email is required"));
//   } else {
//     next();
//   }
// });

// ReferralCampaignSchema.path("wallet").validate(function (value) {
//   return value || this.email;
// }, "Either wallet or email is required");

ReferralCampaignSchema.index({ email: 1, campaignName: 1 }, { unique: true });

const ReferralCampaign =
  mongoose.models.ReferralCampaign ||
  mongoose.model("ReferralCampaign", ReferralCampaignSchema);

export default ReferralCampaign;
