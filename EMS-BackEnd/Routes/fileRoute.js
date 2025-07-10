import express from 'express';
import multer from 'multer';
import { deleteFile, downloadFile, getAllFiles, uploadFile } from '../Controllers/FileController.js';


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/file/upload-file:
 *   post:
 *     summary: Upload a file
 *     tags:
 *       - File
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request (e.g., file missing)
 *       500:
 *         description: Server error
 */
router.post('/upload-file', upload.single('file'), uploadFile);
/**
 * @swagger
 * /api/file/get-all-uploaded-files:
 *   post:
 *     summary: Get all uploaded files (with optional filters and pagination)
 *     tags: [File]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileType:
 *                 type: string
 *               fromDate:
 *                 type: string
 *               toDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Files fetched successfully
 *       500:
 *         description: Error fetching files
 */
router.post('/get-all-uploaded-files', getAllFiles);

/**
 * @swagger
 * /api/file/download-file:
 *   post:
 *     summary: Generate a signed URL to download a file
 *     tags: [File]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Download URL generated
 *       404:
 *         description: File not found
 *       500:
 *         description: Error generating download URL
 */
router.post('/download-file', downloadFile);

/**
 * @swagger
 * /api/file/delete-file:
 *   post:
 *     summary: Delete a file
 *     tags: [File]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Error deleting file
 */
router.post('/delete-file', deleteFile);

export default router;