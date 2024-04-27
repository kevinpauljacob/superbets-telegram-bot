import mongoose from "mongoose";

const roulette1Schema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    wager: {
      type: Object,
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

let Roulette1 =
  mongoose.models.Roulette1 || mongoose.model("Roulette1", roulette1Schema);
export default Roulette1;
