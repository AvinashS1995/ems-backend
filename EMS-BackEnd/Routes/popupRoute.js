
import express from 'express';
import { deletePopupDetails, getAllPopupDetails, getEmployeePopupDetails, savePopupDetails, togglePopupStatus, updatePopupDetails } from '../Controllers/PopupController.js';

const router = express.Router();

/**
 * @swagger
 * /api/popup/save-popup-details:
 *   post:
 *     summary: Save new popup details
 *     tags: [Popup]
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
 *                 type: array
 *                 items:
 *                   type: string
 *               popupType:
 *                 type: string
 *                 enum: [text, file]
 *               textMessage:
 *                 type: string
 *               uploadedFile:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Popup created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/save-popup-details", savePopupDetails);

/**
 * @swagger
 * /api/popup/get-employee-popup:
 *   post:
 *     summary: Get popups for a specific employee
 *     tags: [Popup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employee:
 *                 type: string
 *     responses:
 *       200:
 *         description: Popup list returned
 *       400:
 *         description: Missing employee ID
 *       500:
 *         description: Internal server error
 */
router.post("/get-employee-popup", getEmployeePopupDetails);

/**
 * @swagger
 * /api/popup/get-all-popup:
 *   post:
 *     summary: Get all popup details
 *     tags: [Popup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               role:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               popupType:
 *                 type: string
 *     responses:
 *       200:
 *         description: All popups retrieved
 *       500:
 *         description: Internal server error
 */
router.post("/get-all-popup", getAllPopupDetails);

/**
 * @swagger
 * /api/popup/update-popup-details:
 *   post:
 *     summary: Update popup details
 *     tags: [Popup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
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
 *                 type: array
 *                 items:
 *                   type: string
 *               popupType:
 *                 type: string
 *                 enum: [text, file]
 *               textMessage:
 *                 type: string
 *               uploadedFile:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Popup updated successfully
 *       400:
 *         description: Popup ID is required
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Internal server error
 */
router.post("/update-popup-details", updatePopupDetails);

/**
 * @swagger
 * /api/popup/delete-popup-details:
 *   post:
 *     summary: Delete popup details
 *     tags: [Popup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Popup deleted successfully
 *       400:
 *         description: Popup ID is required
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Internal server error
 */
router.post("/delete-popup-details", deletePopupDetails);
/**
 * @swagger
 * /api/popup/toggle-popup-status:
 *   post:
 *     summary: Toggle popup active status
 *     tags: [Popup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Popup ID
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Popup not found
 *       500:
 *         description: Internal server error
 */
router.post("/toggle-popup-status", togglePopupStatus);


export default router;