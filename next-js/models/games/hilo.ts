import mongoose from "mongoose";

const hiloSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    startNumber: {
      type: Number,
      required: true,
    },
    userBets: Array<"Higher" | "Lower">,
    strikeNumbers: Array<Number>,
    tokenMint: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: ["Won", "Lost", "Pending"],
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

let Hilo = mongoose.models.Hilo || mongoose.model("Hilo", hiloSchema);
export default Hilo;
