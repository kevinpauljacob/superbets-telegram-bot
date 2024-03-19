import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
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
    totalVolume: {
      type: Number,
      default: 0,
    },
    amountWon: {
      type: Number,
      default: 0,
    },
    amountLost: {
      type: Number,
      default: 0,
    },
    betsWon: {
      type: Number,
      default: 0,
    },
    betsLost: {
      type: Number,
      default: 0,
    },
    isBetOngoing: {
      type: Boolean,
      default: false,
    },
    sns: { type: String },
    //flip related fields
    fTotalVolume: {
      type: Number,
      default: 0,
    },
    fAmountWon: {
      type: Number,
      default: 0,
    },
    fAmountLost: {
      type: Number,
      default: 0,
    },
    flipsWon: {
      type: Number,
      default: 0,
    },
    flipsLost: {
      type: Number,
      default: 0,
    },
    //roll related fields
    rTotalVolume: {
      type: Number,
      default: 0,
    },
    rAmountWon: {
      type: Number,
      default: 0,
    },
    rAmountLost: {
      type: Number,
      default: 0,
    },
    rollsWon: {
      type: Number,
      default: 0,
    },
    rollsLost: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

let User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
