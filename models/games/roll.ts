import mongoose from "mongoose";

const rollSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
    },
    rollAmount: {
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
    result: {
      type: String,
      enum: ["Won", "Lost"],
    },
    tokenMint: {
      type: String,
      required: false,
    },
    amountWon: {
      type: Number,
      required: true,
    },
    amountLost: {
      type: Number,
      required: true,
    },
    clientSeed: {
      type: String,
      required: true,
    },
    serverSeed: {
      type: String,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

let Roll = mongoose.models.Roll || mongoose.model("Roll", rollSchema);
export default Roll;
