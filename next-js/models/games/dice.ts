import mongoose from "mongoose";

const diceSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    chosenNumbers: {
      type: [Number],
      validate: {
        validator: function (value: number[]) {
          return (
            Array.isArray(value) &&
            value.every((num) => Number.isInteger(num) && num >= 1 && num <= 6)
          );
        },
        message:
          "chosenNumbers must be an array of whole numbers between 1 and 6.",
      },
      required: true,
    },
    strikeNumber: {
      type: Number,
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value) && value >= 1 && value <= 6;
        },
        message: "strikeNumber must be a whole number between 1 and 6.",
      },
    },
    strikeMultiplier: {
      type: Number,
      required: true,
    },
    result: {
      type: String,
      enum: ["Won", "Lost"],
    },
    tokenMint: {
      type: String,
      required: false,
    },
    houseEdge: {
      type: Number,
      required: true,
    },
    amountWon: {
      type: Number,
      required: true,
    },
    amountLost: {
      type: Number,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    gameSeed: {
      type: mongoose.Schema.ObjectId,
      ref: "GameSeed",
      required: true,
    },
  },
  { timestamps: true },
);

let Dice = mongoose.models.Dice || mongoose.model("Dice", diceSchema);
export default Dice;
