import mongoose from "mongoose";
const Schema = mongoose.Schema;

const DepositSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    type: {
      // true for deposits & false for withdrawal
      type: Boolean,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    tokenMint: {
      type: String,
      required: true,
      default: "SOL",
    },
    status: {
      type: String,
      // review -> pending -> completed
      enum: ["review", "pending", "completed"],
      default: "completed",
      required: true,
    },
    txnSignature: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

let Deposit =
  mongoose.models.Deposit || mongoose.model("Deposit", DepositSchema);

export default Deposit;
