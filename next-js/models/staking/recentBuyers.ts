import mongoose from "mongoose";

const recentBuyerSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      required: true,
    },
    gameId: {
      type: Number,
      required: true,
    },
    numOfTickets: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    txnSignature: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.RecentBuyer ||
  mongoose.model("RecentBuyer", recentBuyerSchema);
