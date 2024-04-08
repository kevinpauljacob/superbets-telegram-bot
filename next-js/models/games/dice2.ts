import mongoose from "mongoose";

const dice2Schema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    direction: {
      type: String,
      enum: ["over", "under"],
      required: true,
    },
    chance: {
      type: Number,
      required: true,
    },
    strikeNumber: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      enum: ["Won", "Lost"],
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
  { timestamps: true }
);

let Dice2 = mongoose.models.Dice2 || mongoose.model("Dice2", dice2Schema);
export default Dice2;