
import { deleteFromFilebase, getPresignedUrl, uploadToFilebase } from "../storage/s3.config.js";
import File from "../Models/fileModel.js";

const uploadFile = async (req, res) => {
  
  try {
    const file  = req.file;

    if (!file) {
      return res.status(400).json({
        status: "fail",
        message: res,
      });
    }

    // Upload to Filebase
    const { fileKey, fileUrl } = await uploadToFilebase(file);

    // Generate preview URL (presigned)
    const presignFileUrl = await getPresignedUrl(fileKey);


    const saved = await File.create({
      fileName: file.originalname,
      fileKey,
      fileType: file.mimetype,
      fileUrl,
      presignFileUrl,
    });

    res.status(201).json({
      status: "success",
      message: "Uploaded successfully",
      data: {
        fileUrl,
        presignFileUrl,
        fileKey
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

    const files = await File.find(filter).sort({ uploadedAt: -1 }).select('-__v').lean();

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
      message: error.message,
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

    // Generate download URL (valid for 5 minutes)
    const downloadUrl = await getPresignedUrl(fileKey, 300);

    res.status(200).json({
      status: "success",
      message: "Download URL generated",
      data: { downloadUrl },
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
    if (!file) {
      return res.status(404).json({ status: "fail", message: "File not found" });
    }

    // ✅ Delete from Filebase (via s3.config.js)
    await deleteFromFilebase(fileKey);

    // ✅ Delete from DB
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
