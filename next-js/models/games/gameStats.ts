import mongoose, { Schema } from "mongoose";

const StatsSchema: Schema = new Schema({
  game: { type: String, required: true },
  volume: {
    SOL: { type: Number, required: true },
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { type: Number, required: true }, //USDC
    Cx9oLynYgC3RrgXzin7U417hNY9D6YB1eMGw4ZMbWJgw: { type: Number, required: true }, //FOMO
  },
  wallets: { type: [String], required: true },
});

const Stats = mongoose.models.Stats || mongoose.model("Stats", StatsSchema);

export default Stats;
