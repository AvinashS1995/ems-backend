import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  fileName: String,
  fileKey: String,
  fileType: String,
  fileUrl: String,
  presignFileUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);

export default File;
