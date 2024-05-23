import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    campaignId: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

let Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
export default Campaign;
