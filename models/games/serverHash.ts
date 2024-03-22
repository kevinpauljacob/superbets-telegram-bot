import mongoose from "mongoose";
import { GameType } from "@/utils/vrf";

const serverHashSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      enum: GameType,
      required: true,
    },
    serverSeed: {
      type: String,
      required: true,
      unique: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    isValid: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true },
);

let ServerHash =
  mongoose.models.ServerHash || mongoose.model("ServerHash", serverHashSchema);

export default ServerHash;
