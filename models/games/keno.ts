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

let Keno = mongoose.models.Keno || mongoose.model("Keno", kenoSchema);
export default Keno;
