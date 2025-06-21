import express from 'express';
import { Login, LogOut, resendOtp, resetPassword, sendOtp, VerifyEmail, verifyOtp } from '../Controllers/LoginController.js';
import { CreateUser, CreateTypeList, GetTypeList, UpdateTypeList, DeleteTypeList, GetUserList, UpdateEmployeeList, DeleteEmployeeList } from '../Controllers/UserController.js';
import upload from '../Middlewares/uploadMiddleware.js';
import { authenticateToken } from '../Middlewares/verifyTokenMiddleware.js';


const router = express.Router();
/**
 * @swagger
 * /api/auth/register-user:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               mobile:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *               type:
 *                 type: string
 *               teamLeader:
 *                 type: string
 *               designation:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *               salary:
 *                 type: number
 *               workType:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/register-user', authenticateToken, upload.single("profileImage") ,CreateUser)
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Login
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
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/login', Login);
/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify User Email
 *     tags:
 *       - Login
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
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/verify-email', VerifyEmail);
/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP User Registered Email
 *     tags:
 *       - Login
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
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/send-otp', sendOtp);
/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Re-Send OTP User Registered Email
 *     tags:
 *       - Login
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
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/resend-otp', resendOtp)
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP User Registered Email
 *     tags:
 *       - Login
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
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/verify-otp', verifyOtp)
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset User password 
 *     tags:
 *       - Login
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
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPassword)
/**
 * @swagger
 * /api/auth/log-out:
 *   post:
 *     summary: Log Out User 
 *     tags:
 *       - Login
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/log-out', LogOut)
/**
 * @swagger
 * /api/auth/get-user-list:
 *   post:
 *     summary: All Employee List 
 *     tags:
 *       - User
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
 *               status:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/get-user-list', authenticateToken, GetUserList)
/**
 * @swagger
 * /api/auth/update-employee-list:
 *   post:
 *     summary: Update Employee List
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *               type:
 *                 type: string
 *               teamLeader:
 *                 type: string
 *               designation:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *               salary:
 *                 type: number
 *               workType:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/update-employee-list', authenticateToken, UpdateEmployeeList)
/**
 * @swagger
 * /api/auth/delete-employee-list:
 *   post:
 *     summary: Delete Employee List
 *     tags:
 *       - User
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
router.post('/delete-employee-list', authenticateToken, DeleteEmployeeList)
/**
 * @swagger
 * /api/auth/save-type-list:
 *   post:
 *     summary: Save Type List
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityValue:
 *                 type: string
 *               typeLabel:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/save-type-list', authenticateToken, CreateTypeList)
/**
 * @swagger
 * /api/auth/get-type-list:
 *   post:
 *     summary: All Type List
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entityValue:
 *                 type: string
 *               typeLabel:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/get-type-list', authenticateToken, GetTypeList)
/**
 * @swagger
 * /api/auth/update-type-list:
 *   post:
 *     summary: Update Type List
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               entityValue:
 *                 type: string
 *               typeLabel:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/update-type-list', authenticateToken, UpdateTypeList)
/**
 * @swagger
 * /api/auth/delete-type-list:
 *   post:
 *     summary: Delete Type List
 *     tags:
 *       - User
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
router.post('/delete-type-list', authenticateToken, DeleteTypeList)


export default router;