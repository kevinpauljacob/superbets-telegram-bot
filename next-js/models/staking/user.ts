import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    //TODO: remove this field after docs are updated
    tier: Number,
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
