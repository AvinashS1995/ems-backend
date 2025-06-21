import crypto from "crypto";
import UploadFileToken from "../Models/uploadFileModel.js";
import { gfs } from "../db/db.js";
import { storage } from "../storage/gridFsStorage.js";
import multer from "multer";


const upload = multer({ storage }).single("file");

export const generateUploadUrl = async (req, res) => {
  const { filename, filetype, size } = req.body;

  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins


  await UploadFileToken.create({
    filename,
    filetype,
    size,
    uploadToken: token,
    tokenExpiry: expiresAt,
  });

  const uploadUrlWithPreSignUrl = `http://${req.headers.host}/upload/${token}`;

  res.json({
    uploadUrl: uploadUrlWithPreSignUrl,
    expiresAt: expiresAt,
  });
};

export const uploadFile = async (req, res) => {

  const { uploadToken ,  fileName} = req.body;

  const tokenDoc = await UploadFileToken.findOne({ uploadToken });

  console.log(uploadToken)

  if (!tokenDoc) {
    return res.status(403).json({ 
        status: "fail", 
        message: 'Invalid Token' 
    });
  }

  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    return res.status(403).json({
      status: "fail", 
      message: 'Token invalid or expired' 
    });
  }

  if (!uploadToken) {
    return res.status(400).json({
      status: "fail",
      message: "Missing token",
    });
  }

  if (tokenDoc.uploaded) {
    return res.status(400).json({
      status: "fail",
      message: "Already uploaded",
    });
  }

  if (new Date() > tokenDoc.tokenExpiry) {
    return res.status(400).json({
      status: "fail",
      message: "Token Expired",
    });
  }

  // Upload file using multer
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: "File upload failed" });
    }

    // if (!req.fileName) {
    //   return res.status(400).json({ message: "No file provided" });
    // }

    // Mark token as uploaded
    tokenDoc.uploaded = true;
    await tokenDoc.save();

    res.status(200).json({
      message: "File uploaded successfully",
      fileName: req.filename,
    });
  });

};

export const downloadFile = async (req, res) => {

  try {
    const file = await gfs.files.findOne({ filename: req.params.filename });

    if (!file)
      return res.status(404).json({
        status: "fail",
        message: "File Not Found",
      });

    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);

  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Error retrieving file",
    });
  }
};

