import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },
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
