import mongoose from "mongoose";

const kenoSchema = new mongoose.Schema(
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
      enum: ["classic", "low", "medium", "high"],
      required: true,
    },
    chosenNumbers: {
      type: Array<number>,
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

let Keno = mongoose.models.Keno || mongoose.model("Keno", kenoSchema);
export default Keno;
