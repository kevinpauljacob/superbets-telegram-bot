import mongoose from "mongoose";
const Schema = mongoose.Schema;

const gameUserSchema = new Schema(
  {
    wallet: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      sparse: true,
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
    gamesPlayed: {
      type: [String],
      default: [],
      required: true,
    },
    isWeb2User: {
      type: Boolean,
      default: true,
      required: true,
    },
    isUSDCClaimed: {
      type: Boolean,
      default: false,
    },
    claimCount: {
      type: Number,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

let GameUser =
  mongoose.models?.GameUser || mongoose.model("GameUser", gameUserSchema);
export default GameUser;
