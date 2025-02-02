import mongoose, { Schema } from "mongoose";

const GameStatsSchema: Schema = new Schema({
  game: {
    type: String,
    required: true,
    unique: true,
  },
  volume: {
    type: Map,
    of: Number,
  },
  feeGenerated: {
    type: Map,
    of: Number,
  },
  numOfWallets: {
    type: Number,
    required: true,
    default: 0,
  },
});

const GameStats =
  mongoose.models.GameStats || mongoose.model("GameStats", GameStatsSchema);

export default GameStats;
