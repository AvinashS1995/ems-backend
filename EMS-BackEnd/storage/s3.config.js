import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 🔄 Generate a presigned GET URL
const getPresignedUrl = async (fileKey, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

// ⬆️ Upload file to Filebase S3
const uploadToFilebase = async (file) => {
  const fileKey = `${uuidv4()}-${file.originalname}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.filebase.com/${fileKey}`;

  const fileUrl = `https://s3.filebase.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;

  return { fileKey, fileUrl };
};

// ❌ Delete from Filebase
const deleteFromFilebase = async (fileKey) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  });
  await s3Client.send(command);
};

export const uploadPDF = async ({ localPath, bucket, key }) => {
  const Body = fs.readFileSync(localPath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body,
      ContentType: "application/pdf",
    })
  );
  // Public URL pattern for Filebase
  return `https://${bucket}.s3.filebase.com/${key}`;
};

export { s3Client, getPresignedUrl, uploadToFilebase, deleteFromFilebase };
