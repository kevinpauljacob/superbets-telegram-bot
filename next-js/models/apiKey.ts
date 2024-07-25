import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    apiKey: {
      type: String,
      required: true,
    },
    access: {
      type: String,
      enum: ["ADMIN", "PUBLIC"],
      required: true,
    },
  },
  { timestamps: true },
);

let ApiKey = mongoose.models.ApiKey || mongoose.model("Apikey", apiKeySchema);
export default ApiKey;
