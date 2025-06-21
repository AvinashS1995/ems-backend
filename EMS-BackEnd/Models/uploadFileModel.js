import mongoose from "mongoose";

const UploadFileTokenSchema = new mongoose.Schema({
  fileName: String,
  fileType: String,
  size: Number,
  uploadToken: String,
  tokenExpiry: Date,
  uploaded: {
    type: Boolean,
    default: false,
  },
});

UploadFileTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UploadFileToken = mongoose.model("UploadFileToken", UploadFileTokenSchema);

export default UploadFileToken;
