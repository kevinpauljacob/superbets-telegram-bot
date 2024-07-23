import mongoose from "mongoose";

const plinkoSchema = new mongoose.Schema(
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
    risk: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    rows: {
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
    tokenMint: {
      type: String,
      required: false,
    },
    houseEdge: {
      type: Number,
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

let Plinko = mongoose.models.Plinko || mongoose.model("Plinko", plinkoSchema);
export default Plinko;
