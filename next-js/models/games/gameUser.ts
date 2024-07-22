import mongoose from "mongoose";
const Schema = mongoose.Schema;

const gameUserSchema = new Schema(
  {
    wallet: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
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
  },
  { timestamps: true },
);

// gameUserSchema.pre("validate", function (next) {
//   if (!this.wallet && !this.email) {
//     this.invalidate("wallet", "Either wallet or email must be provided");
//     this.invalidate("email", "Either wallet or email must be provided");
//   }
//   next();
// });

let GameUser =
  mongoose.models.GameUser || mongoose.model("GameUser", gameUserSchema);
export default GameUser;
