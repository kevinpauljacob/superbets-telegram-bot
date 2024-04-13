import mongoose from "mongoose";

const minesSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    numMines: {
      type: Number,
      required: true,
    },
    strikeNumber: {
      type: Number,
      required: true,
    },
    tokenMint: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ["Won", "Lost"],
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

let Mines = mongoose.models.Mines || mongoose.model("Mines", minesSchema);
export default Mines;
