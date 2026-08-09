import express from "express";
import { authenticateToken } from "../Middlewares/verifyTokenMiddleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../Controllers/NotificationController.js";

const router = express.Router();

/**
 * @swagger
 * /api/notification/get-notifications:
 *   post:
 *     summary: Get Employee Notifications
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
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
 *                 example: EMP002
 *               page:
 *                 type: integer
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 example: 10
 *               module:
 *                 type: string
 *                 example: Leave
 *               isRead:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Notifications Successfully Fetched
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-notifications", authenticateToken, getNotifications);

/**
 * @swagger
 * /api/notification/get-unread-notifications-count:
 *   post:
 *     summary: Get Employee Unread Notification Count
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
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
 *                 example: EMP002
 *     responses:
 *       200:
 *         description: Unread Notification Count Successfully Fetched
 *       400:
 *         description: Bad request or missing employee number
 *       500:
 *         description: Server error
 */
router.post(
  "/get-unread-notifications-count",
  authenticateToken,
  getUnreadNotificationCount,
);

/**
 * @swagger
 * /api/notification/mark-read-notifications:
 *   post:
 *     summary: Mark Notification As Read
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *               - empNo
 *             properties:
 *               notificationId:
 *                 type: string
 *                 example: 68b123456789
 *               empNo:
 *                 type: string
 *                 example: EMP002
 *     responses:
 *       200:
 *         description: Notification Marked As Read Successfully
 *       400:
 *         description: Bad request or missing required fields
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.post(
  "/mark-read-notifications",
  authenticateToken,
  markNotificationAsRead,
);

/**
 * @swagger
 * /api/notification/mark-all-read-notification:
 *   post:
 *     summary: Mark All Employee Notifications As Read
 *     tags:
 *       - Notification
 *     security:
 *       - bearerAuth: []
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
 *                 example: EMP002
 *     responses:
 *       200:
 *         description: All Notifications Marked As Read Successfully
 *       400:
 *         description: Bad request or missing employee number
 *       500:
 *         description: Server error
 */
router.post(
  "/mark-all-read-notification",
  authenticateToken,
  markAllNotificationsAsRead,
);

export default router;
