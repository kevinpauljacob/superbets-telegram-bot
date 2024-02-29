import mongoose from "mongoose";

const txnSignatureSchema = new mongoose.Schema(
  {
    txnSignature: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

let TxnSignature =
  mongoose.models.TxnSignature ||
  mongoose.model("TxnSignature", txnSignatureSchema);

export default TxnSignature;
