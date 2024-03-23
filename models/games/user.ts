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
    isBetOngoing: {
      type: Boolean,
      default: false,
    },
    sns: { type: String },
  },
  { timestamps: true }
);

let User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
