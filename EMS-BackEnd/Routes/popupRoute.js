
import express from 'express';
import { savePopupDetails } from '../Controllers/PopupController.js';

const router = express.Router();

/**
 * @swagger
 * /api/popup/save-popup-details:
 *   post:
 *     summary: Save New Pop Up Details
 *     tags:
 *       - Popup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
  *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               country:
 *                 type: string
 *               role:
 *                 type: string
 *               gender:
 *                 type: string
 *               employee:
 *                 type: string
 *               popupType:
 *                 type: string
 *               textMessage:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               uploadedFile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pop Details created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */

router.post("/save-popup-details", upload.single("uploadedFile"), savePopupDetails);