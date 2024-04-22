import mongoose from "mongoose";

const wheelSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    risk: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    segments: {
      type: Number,
      required: true,
    },
    strikeNumber: {
      type: Number,
      required: true,
    },
    strikeMultiplier: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      enum: ["Won", "Lost"],
      required: true,
    },
    tokenMint: {
      type: String,
      required: true,
    },
    amountWon: {
      type: Number,
      required: true,
    },
    amountLost: {
      type: Number,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    gameSeed: {
      type: mongoose.Schema.ObjectId,
      ref: "GameSeed",
      required: true,
    },
  },
  { timestamps: true },
);

let Wheel = mongoose.models.Wheel || mongoose.model("Wheel", wheelSchema);
export default Wheel;
