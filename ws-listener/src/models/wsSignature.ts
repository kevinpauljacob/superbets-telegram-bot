import mongoose from "mongoose";

const wsSignaturesSchema = new mongoose.Schema(
  {
    signatures: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

wsSignaturesSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const WsSignature = mongoose.model("WsTxnSignature", wsSignaturesSchema);
export default WsSignature;
