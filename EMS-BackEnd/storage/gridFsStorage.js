import { GridFsStorage } from "multer-gridfs-storage";
import dotenv from "dotenv";
import UploadFileToken from "../Models/uploadFileModel.js";
import multer from "multer";
dotenv.config({ path: "./.env" });

const mongoURI = process.env.MONGO_DB_LOCAL_URL;

// GridFS Storage instance
const storage = new GridFsStorage({
  db: mongoURI,
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads', // Should match GridFSBucket name and Default: uploads.files, uploads.chunks
    };
  },
});

export { storage };