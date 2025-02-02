import mongoose from "mongoose";

const coinSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    flipType: {
      type: String,
      enum: ["heads", "tails"],
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
    },
    tokenMint: {
      type: String,
      required: false,
    },
    houseEdge: {
      type: Number,
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

let Coin = mongoose.models.Coin || mongoose.model("Coin", coinSchema);
export default Coin;
