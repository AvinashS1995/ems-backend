import express from "express";
import {
  createAdmin,
  deleteAdmin,
  getAdminActivity,
  GetAdminUserList,
  Login,
  LogOut,
  refreshToken,
  resetPassword,
  toggleLockAdmin,
  updateAdmin,
} from "../Controllers/PortfolioController.js";
import { resetPassworlUrlMailSentMail } from "../mail/sentMailForResetPasswordUrl.js";

const router = express.Router();
/**
 * @swagger
 * /api/portfolio/admin-user-creation:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/admin-user-creation", createAdmin);
/**
 * @swagger
 * /api/portfolio/login:
 *   post:
 *     summary: Admin Login user
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin Login successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/login", Login);
/**
 * @swagger
 * /api/portfolio/refresh-token:
 *   post:
 *     summary: Generate new Access Token using Refresh Token
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 *       400:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/portfolio/admin-log-out:
 *   post:
 *     summary: Log Out Admin user
 *     tags:
 *       - Portfolio
 *     responses:
 *       200:
 *         description: Log Out successfully
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Server error
 */
router.post("/admin-log-out", LogOut);

/**
 * @swagger
 * /api/portfolio/reset-password:
 *   post:
 *     summary: Reset Admin password
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/portfolio/get-admin-user-list:
 *   post:
 *     summary: Get all admin users (Super Admin only)
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record(s) Fetched successfully
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post("/get-admin-user-list", GetAdminUserList);

/**
 * @swagger
 * /api/portfolio/update-admin:
 *   put:
 *     summary: Update admin details
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/update-admin", updateAdmin);

/**
 * @swagger
 * /api/portfolio/delete-admin/{id}:
 *   delete:
 *     summary: Delete an admin by ID
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/delete-admin", deleteAdmin);

/**
 * @swagger
 * /api/portfolio/toggle-lock-admin:
 *   post:
 *     summary: Lock or Unlock an admin account
 *     tags:
 *       - Portfolio
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
 *         description: Admin locked/unlocked successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/toggle-lock-unlock-admin", toggleLockAdmin);

/**
 * @swagger
 * /api/portfolio/get-admin-activity/{id}:
 *   get:
 *     summary: Get admin activity logs by ID
 *     tags:
 *       - Portfolio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Activity logs fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-admin-activity", getAdminActivity);

export default router;
