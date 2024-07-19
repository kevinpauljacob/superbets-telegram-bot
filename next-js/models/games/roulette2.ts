import mongoose from "mongoose";

const roulette2Schema = new mongoose.Schema(
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
    strikeMultiplier: {
      type: Number,
      required: true,
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

let Roulette2 =
  mongoose.models.Roulette2 || mongoose.model("Roulette2", roulette2Schema);
export default Roulette2;
