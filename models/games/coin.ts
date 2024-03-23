import mongoose from "mongoose";

const coinSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    flipAmount: {
      type: Number,
      required: true,
    },
    flipType: {
      type: String,
      enum: ["heads", "tails"],
      required: true,
    },
    strikeNumber: Number,
    result: {
      type: String,
      enum: ["Won", "Lost"],
    },
    tokenMint: {
      type: String,
      required: false,
    },
    amountWon: {
      type: Number,
      required: true,
    },
    amountLost: {
      type: Number,
      required: true,
    },
    clientSeed: {
      type: String,
      required: true,
    },
    serverSeed: {
      type: String,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

let Coin = mongoose.models.Coin || mongoose.model("Coin", coinSchema);
export default Coin;
