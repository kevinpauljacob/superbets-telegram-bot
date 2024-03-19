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
  },
  { timestamps: true }
);

let Flip = mongoose.models.Flip || mongoose.model("Flip", flipSchema);
export default Flip;
