import express from "express";
import {
  createAdmin,
  GetAdminUserList,
  Login,
  LogOut,
  resetPassword,
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
 * /api/portfolio/log-out:
 *   post:
 *     summary: Log Out User
 *     tags:
 *       - Portfolio
 *     responses:
 *       201:
 *         description: Log Out successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/log-out", LogOut);
/**
 * @swagger
 * /api/portfolio/reset-password-url-sent-mail:
 *   post:
 *     summary: Reset User password Url Sent On Mail
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
 *     responses:
 *       201:
 *         description: Reset Password Url Sent on Mail successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/reset-password-url-sent-mail", resetPassworlUrlMailSentMail);
/**
 * @swagger
 * /api/portfolio/reset-password:
 *   post:
 *     summary: Reset User password
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
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reset Password successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);
/**
 * @swagger
 * /api/portfolio/get-admin-user-list:
 *   post:
 *     summary: All Employee List
 *     tags:
 *       - Portfolio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record(s) Fetched successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-admin-user-list", GetAdminUserList);

export default router;
