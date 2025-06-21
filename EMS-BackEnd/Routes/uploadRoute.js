import express from 'express';
import { downloadFile, generateUploadUrl, uploadFile } from '../Controllers/FileController.js';


const router = express.Router();

router.post('/generate-upload-url', generateUploadUrl)
router.post('/uploadFile', uploadFile)
router.post('/downloadFile', downloadFile)

export default router;