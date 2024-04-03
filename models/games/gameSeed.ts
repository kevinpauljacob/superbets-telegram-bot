import { seedStatus } from "@/utils/vrf";
import mongoose from "mongoose";

const gameSeedSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    clientSeed: String,
    serverSeed: {
      type: String,
      required: true,
      unique: true,
    },
    serverSeedHash: {
      type: String,
      required: true,
    },
    currentNonce: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: seedStatus,
      required: true,
      default: seedStatus.NEXT,
    },
  },
  { timestamps: true },
);

let GameSeed =
  mongoose.models.GameSeed || mongoose.model("GameSeed", gameSeedSchema);

export default GameSeed;