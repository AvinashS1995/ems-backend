import express from 'express';
import { approvalFlow, approveRejectLeave, getAllLeaves, GetUpcomingHolidays, LeaveRequestList, saveEmployeeLeave } from "../Controllers/LeaveController.js";
import { authenticateToken } from '../Middlewares/verifyTokenMiddleware.js';


const router = express.Router();

/**
 * @swagger
 * /api/leave/save-employee-leave:
 *   post:
 *     summary: Save Employee Leave
 *     tags:
 *       - Leave
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empNo:
 *                 type: string
 *               name:
 *                 type: string
 *               leaveType:
 *                 type: string
 *               leaveDuration:
 *                 type: string
 *               fromDate:
 *                 type: string
 *               toDate:
 *                 type: string
 *               reasonType:
 *                 type: string
 *               reasonComment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee Leave Application successfully created !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/save-employee-leave', authenticateToken, saveEmployeeLeave)
/**
 * @swagger
 * /api/leave/get-employee-all-leave:
 *   post:
 *     summary: Employee All Leave List
 *     tags:
 *       - Leave
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
 *         description: Record Successfully Fetched
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/get-employee-all-leave', authenticateToken, getAllLeaves)
/**
 * @swagger
 * /api/leave/get-empployee-leave-request-list:
 *   post:
 *     summary: Get Employee Leave Request List
 *     tags:
 *       - Leave
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empNo:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee Leave Application Approve Reject successfully !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/get-empployee-leave-request-list', LeaveRequestList)
/**
 * @swagger
 * /api/leave/employee-leave-application-approve-reject:
 *   post:
 *     summary: Employee Leave Approval Flow
 *     tags:
 *       - Leave
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveId:
 *                 type: string
 *               action:
 *                 type: string
 *               role:
 *                 type: string
 *               approverComment:
 *                 type: string
 *               updatedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee Leave Application Approve Reject successfully !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/employee-leave-application-approve-reject', authenticateToken, approveRejectLeave)
/**
 * @swagger
 * /api/leave/application-approval-flow:
 *   post:
 *     summary: Employee Leave Approval Flow
 *     tags:
 *       - Leave
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaveId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee Leave Application Approval Flow successfully !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/application-approval-flow', authenticateToken, approvalFlow)
/**
 * @swagger
 * /api/leave/get-upcoming-holidays:
 *   get:
 *     summary: Get All Upcoming Holidays New Menu
 *     tags:
 *       - Leave
 *     responses:
 *       200:
 *         description: Record(s) Fetched successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.get('/get-upcoming-holidays', GetUpcomingHolidays)


export default router;