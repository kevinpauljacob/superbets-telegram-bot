import { seedStatus } from "@/utils/provably-fair";
import mongoose from "mongoose";

const gameSeedSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    iv: {
      type: String,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      default: seedStatus.NEXT,
    },
    pendingMines: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
);

let GameSeed =
  mongoose.models.GameSeed || mongoose.model("GameSeed", gameSeedSchema);

export default GameSeed;
