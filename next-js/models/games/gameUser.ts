import mongoose from "mongoose";
const Schema = mongoose.Schema;

const gameUserSchema = new Schema(
  {
    wallet: {
      type: String,
      required: true,
      unique: true,
    },
    deposit: [
      {
        amount: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
        },
        tokenMint: {
          type: String,
          required: true,
          default: "SOL",
        },
      },
    ],
    isOptionOngoing: {
      type: Boolean,
      default: false,
    },
    sns: { type: String },
    numOfGamesPlayed: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true },
);

let GameUser =
  mongoose.models.GameUser || mongoose.model("GameUser", gameUserSchema);
export default GameUser;
