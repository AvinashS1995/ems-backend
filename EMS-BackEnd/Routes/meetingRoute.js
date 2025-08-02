import express from "express";
import {
  deleteMeetingSchedule,
  getAllEmployeeMeetingUrls,
  getAllMeetingSchedule,
  saveMeetingSchedule,
  saveOrUpdateEmployeeMeetingUrl,
  updateMeetingSchedule,
} from "../Controllers/MeetingController.js";

const router = express.Router();

/**
 * @swagger
 * /api/meeting/save-meeting-schedule:
 *   post:
 *     summary: Schedule a new meeting
 *     tags: [Meeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               meetingType:
 *                 type: string
 *               location:
 *                 type: string
 *               platform:
 *                 type: string
 *               description:
 *                 type: string
 *               empNo:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     empNo:
 *                       type: string
 *     responses:
 *       201:
 *         description: Meeting scheduled successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/save-meeting-schedule", saveMeetingSchedule);

/**
 * @swagger
 * /api/meeting/get-all-meeting-schedule:
 *   post:
 *     summary: Get all meetings for an employee
 *     tags: [Meeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empNo:
 *                 type: string
 *               meetingType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meetings fetched successfully
 *       404:
 *         description: No meetings found
 *       500:
 *         description: Internal server error
 */
router.post("/get-all-meeting-schedule", getAllMeetingSchedule);

/**
 * @swagger
 * /api/meeting/delete-meeting-schedule:
 *   post:
 *     summary: Delete a meeting by ID
 *     tags: [Meeting]
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
 *         description: Meeting deleted successfully
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Internal server error
 */
router.post("/delete-meeting-schedule", deleteMeetingSchedule);

/**
 * @swagger
 * /api/meeting/update-meeting-schedule:
 *   post:
 *     summary: Update meeting details
 *     tags: [Meeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               meetingType:
 *                 type: string
 *               platform:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     empNo:
 *                       type: string
 *     responses:
 *       200:
 *         description: Meeting updated successfully
 *       404:
 *         description: Meeting not found
 *       500:
 *         description: Internal server error
 */
router.post("/update-meeting-schedule", updateMeetingSchedule);

/**
 * @swagger
 * /api/meeting/save-update-employee-meeting-url:
 *   post:
 *     summary: Save or update an employee's meeting URL for a platform
 *     tags: [Meeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empNo
 *               - employeeName
 *               - email
 *               - platform
 *               - meetingUrl
 *             properties:
 *               empNo:
 *                 type: string
 *               employeeName:
 *                 type: string
 *               email:
 *                 type: string
 *               platform:
 *                 type: string
 *               meetingUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting URL saved or updated successfully
 *       400:
 *         description: empNo, platform, and meetingUrl are required
 *       500:
 *         description: Internal server error
 */

router.post(
  "/save-update-employee-meeting-url",
  saveOrUpdateEmployeeMeetingUrl
);
/**
 * @swagger
 * /api/meeting/get-all-employee-meeting-urls:
 *   post:
 *     summary: Get all saved employee meeting URLs
 *     tags: [Meeting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empNo
 *             properties:
 *               empNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully fetched all employee meeting URLs
 *       500:
 *         description: Internal server error
 */

router.post("/get-all-employee-meeting-urls", getAllEmployeeMeetingUrls);

export default router;
