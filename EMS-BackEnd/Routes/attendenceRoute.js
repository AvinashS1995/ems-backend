import express from 'express';
import { attendanceSummary, checkOut, getAttendance, sendCheckInsOtp, verifyCheckInsOtp, workSummary } from '../Controllers/AttendenceController.js';


const router = express.Router();

/**
 * @swagger
 * /api/attendence/send-check-ins-otp:
 *   post:
 *     summary: Send OTP User Registered Email for Check Ins Attendence
 *     tags:
 *       - Attendence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Send OTP
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/send-check-ins-otp', sendCheckInsOtp);
/**
 * @swagger
 * /api/attendence/verify-check-ins-otp:
 *   post:
 *     summary: Verify OTP User Registered Email for Check Ins Attendence
 *     tags:
 *       - Attendence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Check Ins
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/verify-check-ins-otp', verifyCheckInsOtp);
/**
 * @swagger
 * /api/attendence/check-out:
 *   post:
 *     summary: Check Out for Attendence
 *     tags:
 *       - Attendence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Check Out
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/check-out', checkOut);
/**
 * @swagger
 * /api/attendence/work-summary:
 *   post:
 *     summary: Work Summary for Attendence
 *     tags:
 *       - Attendence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Check Out
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/work-summary', workSummary);
/**
 * @swagger
 * /api/attendence/get-attendence-list:
 *   post:
 *     summary: Get All Attendence
 *     tags:
 *       - Attendence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully Send OTP
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/get-attendence-list', getAttendance);
/**
 * @swagger
 * /api/attendence/get-attendence-summary:
 *   get:
 *     summary: Get Attendece Today Summary 
 *     tags:
 *       - Menu
 *     responses:
 *       200:
 *         description: Get Records successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.get('/get-attendence-summary', attendanceSummary)



export default router;
