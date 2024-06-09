import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    solAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    keys: {
      type: Number,
      default: 0,
      required: true,
    },
    stakedAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    multiplier: {
      type: Number,
      default: 0.5,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
