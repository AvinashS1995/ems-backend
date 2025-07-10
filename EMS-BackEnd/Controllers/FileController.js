// controllers/upload.controller.js
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../storage/s3.config.js";
import File from "../Models/fileModel.js";
import { v4 as uuidv4 } from "uuid";

const uploadFile = async (req, res) => {
  
  try {
    const file  = req.file;

    if (!file) {
      return res.status(400).json({
        status: "fail",
        message: res,
      });
    }

    const fileKey = `${uuidv4()}-${file.originalname}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload to Filebase (S3)
    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.filebase.com/${fileKey}`;

    // Generate preview URL (signed)
    const previewUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    const saved = await File.create({
      fileName: file.originalname,
      fileKey,
      fileType: file.mimetype,
      fileUrl,
      previewUrl,
    });

    res.status(201).json({
      status: "success",
      message: "Uploaded successfully",
      data: {
        fileUrl,
        previewUrl,
        // file: saved,
      },
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getAllFiles = async (req, res) => {
  
  try {
    let { fileType, fromDate, toDate } = req.body;

    const filter = {};

    if (fileType && typeof fileType === "string" && fileType.trim() !== "") {
      filter["$or"] = [
        {
          fileName: { $regex: new RegExp(`.${fileType.split("/")[1]}$`, "i") },
        },
        { fileType: fileType },
      ];
    }

    if (fromDate && !isNaN(Date.parse(fromDate))) {
      fromDate = new Date(fromDate);
    } else {
      fromDate = null;
    }

    if (toDate && !isNaN(Date.parse(toDate))) {
      toDate = new Date(new Date(toDate).setHours(23, 59, 59, 999));
    } else {
      toDate = null;
    }

    if (fromDate || toDate) {
      filter.uploadedAt = {};
      if (fromDate) filter.uploadedAt.$gte = fromDate;
      if (toDate) filter.uploadedAt.$lte = toDate;
    }

    const files = await File.find(filter).sort({ uploadedAt: -1 }).lean();

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully",
      total: files.length,
      files,
    });
  } catch (error) {
    console.error("Get files error:", error);
    res.status(500).json({
      status: "fail",
      message: "Failed to fetch files",
    });
  }
};

const downloadFile = async (req, res) => {
  
  try {

    const { fileKey } = req.body;

    const file = await File.findOne({ fileKey });

    if (!file) {
      return res.status(404).json({
        status: "fail",
        message: "File not found",
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    res.status(200).json({
      status: "success",
      message: "Download URL generated",
      data: {
        downloadUrl,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deleteFile = async (req, res) => {

  try {

    const { fileKey } = req.body;

    const file = await File.findOne({ fileKey });
    if (!file) return res.status(404).json({ message: "File not found" });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      })
    );

    await File.deleteOne({ fileKey });

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      status: "fail",
      message: "Error deleting file",
    });
  }
};

export { uploadFile, getAllFiles, downloadFile, deleteFile };
