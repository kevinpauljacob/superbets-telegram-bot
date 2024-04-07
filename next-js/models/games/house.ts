import mongoose from "mongoose";
const Schema = mongoose.Schema;

const HouseSchema = new Schema({
  totalVolume: {
    type: Number,
    default: 0,
  },
  totalBets: {
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
  taxCollected: {
    type: Number,
    default: 0,
  },
  //common for both bet and flip
  houseBalance: {
    type: Number,
    default: 0,
  },
  //flip related fields
  fTotalVolume: {
    type: Number,
    default: 0,
  },
  totalFlips: {
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
  fTaxCollected: {
    type: Number,
    default: 0,
  },
  //roll related fields
  rTotalVolume: {
    type: Number,
    default: 0,
  },
  totalRolls: {
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
  rTaxCollected: {
    type: Number,
    default: 0,
  },
});

let House = mongoose.models.House || mongoose.model("House", HouseSchema);

export default House;
