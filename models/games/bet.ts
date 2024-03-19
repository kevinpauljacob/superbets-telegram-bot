import mongoose from "mongoose";
const Schema = mongoose.Schema;

const BetSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    betTime: {
      type: Date,
      required: false,
    },
    betEndTime: {
      type: Date,
      required: false,
    },
    betAmount: {
      type: Number,
      required: true,
    },
    betType: {
      type: Boolean, // if true -> betUp else betDown
      required: true,
    },
    strikePrice: {
      type: Number,
      required: false,
    },
    betEndPrice: {
      type: Number,
      required: false,
    },
    timeFrame: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      enum: ["Pending", "Won", "Lost"],
      default: "Pending",
    },
    tokenMint: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

let Bet = mongoose.models.Bet || mongoose.model("Bet", BetSchema);

export default Bet;
