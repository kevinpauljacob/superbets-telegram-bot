import mongoose from "mongoose";
const Schema = mongoose.Schema;

const OptionSchema = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    betType: {
      type: String,
      enum: ["betUp", "betDown"],
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
    houseEdge: Number,
  },
  { timestamps: true },
);

let Option = mongoose.models.Option || mongoose.model("Option", OptionSchema);

export default Option;
