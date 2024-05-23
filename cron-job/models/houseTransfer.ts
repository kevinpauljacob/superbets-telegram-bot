import mongoose from "mongoose";

const houseTransferSchema = new mongoose.Schema(
  {
    tokenMint: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["hot-to-cold", "cold-to-hot"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const HouseTransfer =
  mongoose.models.HouseTransfer ||
  mongoose.model("HouseTransfer", houseTransferSchema);
export default HouseTransfer;
