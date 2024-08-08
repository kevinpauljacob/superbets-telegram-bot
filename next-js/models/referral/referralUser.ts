import mongoose, { Schema } from "mongoose";

const ReferralUserSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// ReferralUserSchema.pre("validate", function (next) {
//   if (!this.wallet && !this.email) {
//     next(new Error("Either wallet or email is required"));
//   } else {
//     next();
//   }
// });

// ReferralUserSchema.path("wallet").validate(function (value) {
//   return value || this.email;
// }, "Either wallet or email is required");

const ReferralUser =
  mongoose.models.ReferralUser ||
  mongoose.model("ReferralUser", ReferralUserSchema);

export default ReferralUser;
