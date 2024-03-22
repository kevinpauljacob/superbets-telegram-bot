import mongoose from "mongoose";

const flipSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    flipAmount: {
      type: Number,
      required: true,
    },
    flipType: {
      type: Boolean, // if true -> heads
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

let Flip = mongoose.models.Flip || mongoose.model("Flip", flipSchema);
export default Flip;
