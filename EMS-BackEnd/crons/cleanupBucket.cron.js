import cron from "node-cron";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import File from "../Models/fileModel.js";
import sendEmailToAdmin from "../mail/sendMailtoAdmin.js";
import dotenv from "dotenv";
import { s3Client } from "../storage/s3.config.js";

dotenv.config({ path: "./.env" });

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const LIMIT = 1000;

// cron.schedule('0 0 * * *', async () =>
export async function bucketCleanUp() {
  try {
    console.log("[Cron] Checking bucket and DB file count...");

    const dbCount = await File.countDocuments();
    if (dbCount < LIMIT) {
      console.log(`[Cron] DB has only ${dbCount} files. No cleanup needed.`);
    }

    let allObjects = [];
    let isTruncated = true;
    let ContinuationToken;

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1000,
        ContinuationToken,
      });

      const result = await s3Client.send(listCommand);
      allObjects = allObjects.concat(result.Contents || []);
      isTruncated = result.IsTruncated;
      ContinuationToken = result.NextContinuationToken;
    }

    const bucketCount = allObjects.length;
    console.log(`[Cron] Bucket has ${bucketCount} files.`);

    if (bucketCount >= LIMIT - 10) {
      await sendEmailToAdmin(
        "⚠️ Filebase Storage Alert: Only 10 Uploads Left",
        bucketCount,
        LIMIT
      );
      console.log("[Cron] Admin notified via email.");
    }

    if (bucketCount <= 995) {
      console.log("[Cron] Bucket has ≤ 995 files. No deletions needed.");
      return;
    }

    allObjects.sort(
      (a, b) => new Date(a.LastModified) - new Date(b.LastModified)
    );

    const filesToDelete = allObjects.slice(0, bucketCount - 995);

    for (const file of filesToDelete) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.Key,
        })
      );
      console.log(`[Cron] Deleted from bucket: ${file.Key}`);
    }

    console.log(`[Cron] Cleanup done. ${filesToDelete.length} files removed.`);
  } catch (error) {
    console.error("[Cron] Cleanup error:", error);
  }
}

export default function startBucketCleanUpCron() {
  cron.schedule("0 0 * * *", () => {
    console.log("[Cron] Checking bucket and DB file count...");
    bucketCleanUp();
  });

//   bucketCleanUp()
}
