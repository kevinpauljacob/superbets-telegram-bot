import mongoose from "mongoose";
const Schema = mongoose.Schema;

const DepositSchema = new Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameUser",
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
    comments: {
      type: String,
      default: "NA",
      required: true,
    },
    txnSignature: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

let Deposit =
  mongoose.models.Deposit || mongoose.model("Deposit", DepositSchema);

export default Deposit;
