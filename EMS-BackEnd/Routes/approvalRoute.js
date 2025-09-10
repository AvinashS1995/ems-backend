import express from "express";
import {
  deleteApprovalDetails,
  getAllApprovalDetails,
  getAllModels,
  getEmpApprovalList,
  saveApprovalDetails,
  updateApprovalDetails,
} from "../Controllers/ApprovalController.js";

const router = express.Router();

/**
 * @swagger
 * /api/approval/save-approval-configuration-details:
 *   post:
 *     summary: Approval Configure for Request
 *     tags:
 *       - Approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               typeName:
 *                 type: string
 *               listApprovalFlowDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     sequenceNo:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Employee Leave Application successfully created !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/save-approval-configuration-details", saveApprovalDetails);
/**
 * @swagger
 * /api/approval/get-all-approval-configuration-details:
 *   post:
 *     summary: Get All Approval List
 *     tags:
 *       - Approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               typeName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-all-approval-configuration-details", getAllApprovalDetails);
/**
 * @swagger
 * /api/approval/update-approval-configuration-detail:
 *   post:
 *     summary: Update Approval List
 *     tags:
 *       - Approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *               typeName:
 *                 type: string
 *               listApprovalFlowDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     sequenceNo:
 *                       type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/update-approval-configuration-detail", updateApprovalDetails);
/**
 * @swagger
 * /api/approval/delete-approval-configuration-detail:
 *   post:
 *     summary: Delete Approval List
 *     tags:
 *       - Approval
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
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/delete-approval-configuration-detail", deleteApprovalDetails);
/**
 * @swagger
 * /api/approval/get-employee-approval-request-list:
 *   post:
 *     summary: Get All Employee Approval Request List
 *     tags:
 *       - Approval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approverEmpNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record(s) Fetched successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-employee-approval-request-list", getEmpApprovalList);
/**
 * @swagger
 * /api/approval/get-all-models:
 *   post:
 *     summary: Get All Models in Our Projects
 *     tags:
 *       - Approval
 *     responses:
 *       200:
 *         description: Record(s) successfully Fetched
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-all-models", getAllModels);

export default router;
