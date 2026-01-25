import express from "express";
const router = express.Router();
import {
  DeleteWorkTrackings,
  GetWorkTrackingKpis,
  GetWorkTrackings,
  SaveWorkTrackings,
  UpdateWorkTrackings,
} from "../Controllers/WorkTrackingsController.js";

/**
 * @swagger
 * /api/work-trackings/save-work-trackings:
 *   post:
 *     summary: Create a new Work Tracking entry
 *     tags: [Work Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 example: 2026-01-10
 *               projectName:
 *                 type: string
 *                 example: HRMS
 *               moduleName:
 *                 type: string
 *                 example: Leave
 *               taskName:
 *                 type: string
 *                 example: Leave approval UI
 *               taskType:
 *                 type: string
 *                 example: Feature
 *               priority:
 *                 type: string
 *                 example: High
 *               jiraId:
 *                 type: string
 *                 example: HRMS-101
 *               layer:
 *                 type: string
 *                 example: UI
 *               frontendTech:
 *                 type: string
 *                 example: Angular
 *               backendTech:
 *                 type: string
 *                 example: Node.js
 *               componentOrApi:
 *                 type: string
 *                 example: LeaveApprovalComponent
 *               apiIntegrated:
 *                 type: string
 *                 example: Yes
 *               status:
 *                 type: string
 *                 example: Completed
 *               estimatedHours:
 *                 type: number
 *                 example: 6
 *               actualHours:
 *                 type: number
 *                 example: 7
 *               startDate:
 *                 type: string
 *                 example: 7
 *               endDate:
 *                 type: string
 *                 example: 7
 *               blocker:
 *                 type: string
 *                 example: No
 *               repo:
 *                 type: string
 *                 example: hrms-ui
 *               branch:
 *                 type: string
 *                 example: feature/leave-ui
 *               baseBranch:
 *                 type: string
 *                 example: develop
 *               prNo:
 *                 type: string
 *                 example: PR-45
 *               reviewer:
 *                 type: string
 *                 example: Tech Lead
 *               prStatus:
 *                 type: string
 *                 example: Merged
 *               mergeType:
 *                 type: string
 *                 example: Squash
 *               mergeDate:
 *                 type: string
 *                 example: 2026-01-12
 *               deployedTo:
 *                 type: string
 *                 example: Staging
 *               deploymentDate:
 *                 type: string
 *                 example: 2026-01-13
 *               deployedBy:
 *                 type: string
 *                 example: CI/CD
 *               releaseVersion:
 *                 type: string
 *                 example: v1.2.0
 *               verifiedBy:
 *                 type: string
 *                 example: QA
 *               prodIssue:
 *                 type: string
 *                 example: No
 *               prodIssueDesc:
 *                 type: string
 *               fixApplied:
 *                 type: string
 *               collaborationWith:
 *                 type: string
 *                 example: Backend Team
 *               communicationMode:
 *                 type: string
 *                 example: Teams
 *               remarks:
 *                 type: string
 *                 example: Delivered on time
 *     responses:
 *       201:
 *         description: Work entry created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

router.post("/save-work-trackings", SaveWorkTrackings);

/**
 * @swagger
 * /api/work-trackings/get-work-tracking-kpis:
 *   post:
 *     summary: Get KPI data for Work Tracking dashboard
 *     tags: [Work Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: KPI data fetched successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-work-tracking-kpis", GetWorkTrackingKpis);

/**
 * @swagger
 * /api/work-trackings/get-work-trackings:
 *   post:
 *     summary: Get Work Tracking list
 *     tags: [Work Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empNo:
 *                 type: string
 *               fromDate:
 *                 type: string
 *               toDate:
 *                 type: string
 *               project:
 *                 type: string
 *               search:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work Tracking list fetched successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-work-trackings", GetWorkTrackings);

/**
 * @swagger
 * /api/work-trackings/update-work-trackings:
 *   post:
 *     summary: Update an existing Work Tracking entry
 *     tags: [Work Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 65b123abc456def789012345
 *               date:
 *                 type: string
 *                 example: 2026-01-10
 *               projectName:
 *                 type: string
 *                 example: HRMS
 *               moduleName:
 *                 type: string
 *                 example: Leave
 *               taskName:
 *                 type: string
 *                 example: Leave approval UI
 *               taskType:
 *                 type: string
 *                 example: Feature
 *               priority:
 *                 type: string
 *                 example: High
 *               jiraId:
 *                 type: string
 *                 example: HRMS-101
 *               layer:
 *                 type: string
 *                 example: UI
 *               frontendTech:
 *                 type: string
 *                 example: Angular
 *               backendTech:
 *                 type: string
 *                 example: Node.js
 *               componentOrApi:
 *                 type: string
 *                 example: LeaveApprovalComponent
 *               apiIntegrated:
 *                 type: string
 *                 example: Yes
 *               status:
 *                 type: string
 *                 example: Completed
 *               estimatedHours:
 *                 type: number
 *                 example: 6
 *               actualHours:
 *                 type: number
 *                 example: 7
 *               startDate:
 *                 type: string
 *                 example: 7
 *               endDate:
 *                 type: string
 *                 example: 7
 *               blocker:
 *                 type: string
 *                 example: No
 *               repo:
 *                 type: string
 *                 example: hrms-ui
 *               branch:
 *                 type: string
 *                 example: feature/leave-ui
 *               baseBranch:
 *                 type: string
 *                 example: develop
 *               prNo:
 *                 type: string
 *                 example: PR-45
 *               reviewer:
 *                 type: string
 *                 example: Tech Lead
 *               prStatus:
 *                 type: string
 *                 example: Merged
 *               mergeType:
 *                 type: string
 *                 example: Squash
 *               mergeDate:
 *                 type: string
 *                 example: 2026-01-12
 *               deployedTo:
 *                 type: string
 *                 example: Staging
 *               deploymentDate:
 *                 type: string
 *                 example: 2026-01-13
 *               deployedBy:
 *                 type: string
 *                 example: CI/CD
 *               releaseVersion:
 *                 type: string
 *                 example: v1.2.0
 *               verifiedBy:
 *                 type: string
 *                 example: QA
 *               prodIssue:
 *                 type: string
 *                 example: No
 *               prodIssueDesc:
 *                 type: string
 *               fixApplied:
 *                 type: string
 *               collaborationWith:
 *                 type: string
 *                 example: Backend Team
 *               communicationMode:
 *                 type: string
 *                 example: Teams
 *               remarks:
 *                 type: string
 *                 example: Delivered on time
 *     responses:
 *       200:
 *         description: Work entry updated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Work entry not found
 *       500:
 *         description: Internal server error
 */
router.post("/update-work-trackings", UpdateWorkTrackings);

/**
 * @swagger
 * /api/work-trackings/delete-work-trackings:
 *   post:
 *     summary: Delete a Work Tracking entry
 *     tags: [Work Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: 65b123abc456def789012345
 *     responses:
 *       200:
 *         description: Work entry deleted successfully
 *       404:
 *         description: Work entry not found
 *       500:
 *         description: Internal server error
 */
router.post("/delete-work-trackings", DeleteWorkTrackings);

export default router;
