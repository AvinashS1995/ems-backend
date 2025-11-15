import express from "express";
import {
  AddEducation,
  AddPortfolioContactInfo,
  AddPortfolioExperiences,
  AddPortfolioProjects,
  AddPortfolioServices,
  createAdmin,
  deleteAdmin,
  deleteContactMessage,
  DeleteEducation,
  DeletePortfolioContactInfo,
  DeletePortfolioExperiences,
  DeletePortfolioProjects,
  DeletePortfolioServices,
  getAdminActivity,
  GetAdminUserList,
  GetAllContactMessages,
  getDashboardCards,
  getDashboardStats,
  GetPortfolioAbout,
  GetPortfolioContactInfo,
  GetPortfolioEducations,
  GetPortfolioExperiences,
  GetPortfolioProjects,
  GetPortfolioServices,
  Login,
  LogOut,
  refreshToken,
  resetPassword,
  SaveContactMessage,
  saveDashboardCards,
  saveDashboardStats,
  SavePortfolioAbout,
  toggleLockAdmin,
  updateAdmin,
  UpdateEducation,
  UpdatePortfolioContactInfo,
  UpdatePortfolioExperiences,
  UpdatePortfolioProjects,
  UpdatePortfolioServices,
} from "../Controllers/PortfolioController.js";

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
 *   post:
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
 * /api/portfolio/delete-admin:
 *   post:
 *     summary: Delete an admin by ID
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
 * /api/portfolio/get-admin-activity:
 *   post:
 *     summary: Get admin activity logs by ID
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
 *         description: Activity logs fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-admin-activity", getAdminActivity);
/**
 * @swagger
 * /api/portfolio/save-cards:
 *   post:
 *     summary: Save or update dashboard cards for a role
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
 *                 example: Admin
 *               cards:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     icon:
 *                       type: string
 *                     title:
 *                       type: string
 *                     desc:
 *                       type: string
 *                     link:
 *                       type: string
 *     responses:
 *       201:
 *         description: Cards saved successfully
 *       200:
 *         description: Cards updated successfully
 *       400:
 *         description: Role or cards missing
 *       500:
 *         description: Server error
 */
router.post("/save-admin-dashboard-cards", saveDashboardCards);

/**
 * @swagger
 * /api/portfolio/get-cards:
 *   post:
 *     summary: Get dashboard cards by role
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
 *                 example: Admin
 *     responses:
 *       200:
 *         description: Cards fetched successfully
 *       404:
 *         description: No cards found
 *       400:
 *         description: Role is required
 *       500:
 *         description: Server error
 */
router.post("/get-admin-dashboard-cards", getDashboardCards);

/**
 * @swagger
 * /api/portfolio/save-stats:
 *   post:
 *     summary: Save or update dashboard stats for a role
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
 *                 example: Admin
 *               stats:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     count:
 *                       type: number
 *                     icon:
 *                       type: string
 *                     link:
 *                       type: string
 *                     color:
 *                       type: string
 *     responses:
 *       201:
 *         description: Stats saved successfully
 *       200:
 *         description: Stats updated successfully
 *       400:
 *         description: Role or stats missing
 *       500:
 *         description: Server error
 */
router.post("/save-admin-dashboard-stats", saveDashboardStats);

/**
 * @swagger
 * /api/portfolio/get-stats:
 *   post:
 *     summary: Get dashboard stats by role
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
 *                 example: Admin
 *     responses:
 *       200:
 *         description: Stats fetched successfully
 *       404:
 *         description: No stats found
 *       400:
 *         description: Role is required
 *       500:
 *         description: Server error
 */
router.post("/get-admin-dashboard-stats", getDashboardStats);
/**
 * @swagger
 * /api/portfolio/save-about:
 *   post:
 *     summary: Create or update About section for Admin or Super Admin
 *     tags:
 *       - Portfolio (About)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: Only required when Super Admin updates another admin's portfolio
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               bio:
 *                 type: string
 *               bio2:
 *                 type: string
 *               profileImage:
 *                 type: string
 *               resumeUrl:
 *                 type: string
 *               stats:
 *                 type: object
 *                 properties:
 *                   experience:
 *                     type: number
 *                   clients:
 *                     type: number
 *                   recruiters:
 *                     type: number
 *     responses:
 *       200:
 *         description: About section saved successfully
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-about-section", SavePortfolioAbout);

/**
 * @swagger
 * /api/portfolio/public/about/{adminId}:
 *   get:
 *     summary: Get About data for public portfolio
 *     tags:
 *       - Portfolio (About)
 *     parameters:
 *       - name: adminId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID whose public profile should be shown
 *     responses:
 *       200:
 *         description: About data fetched successfully
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-about", GetPortfolioAbout);
/**
 * @swagger
 * /api/portfolio/save-portfolio-education:
 *   post:
 *     summary: Add new education entry for Admin
 *     tags:
 *       - Portfolio (Education)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               degree:
 *                 type: string
 *               university:
 *                 type: string
 *               period:
 *                 type: string
 *     responses:
 *       201:
 *         description: Education added successfully
 *       400:
 *         description: All fields are required
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-education", AddEducation);
/**
 * @swagger
 * /api/portfolio/update-portfolio-education:
 *   post:
 *     summary: Update an existing education entry
 *     tags:
 *       - Portfolio (Education)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Education updated successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin or education not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-educations", GetPortfolioEducations);
/**
 * @swagger
 * /api/portfolio/update-portfolio-education:
 *   post:
 *     summary: Update an existing education entry
 *     tags:
 *       - Portfolio (Education)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               eduId:
 *                 type: string
 *               degree:
 *                 type: string
 *               university:
 *                 type: string
 *               period:
 *                 type: string
 *     responses:
 *       200:
 *         description: Education updated successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin or education not found
 *       500:
 *         description: Server error
 */
router.post("/update-portfolio-education", UpdateEducation);
/**
 * @swagger
 * /api/portfolio/delete-portfolio-education:
 *   post:
 *     summary: Delete an education entry
 *     tags:
 *       - Portfolio (Education)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               eduId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Education deleted successfully
 *       400:
 *         description: Admin ID and Education ID required
 *       404:
 *         description: Admin or education not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-education", DeleteEducation);
/**
 * @swagger
 * /api/portfolio/save-portfolio-experience:
 *   post:
 *     summary: Add a new experience entry
 *     tags:
 *       - Portfolio (Experience)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               company:
 *                 type: string
 *               role:
 *                 type: string
 *               period:
 *                 type: string
 *               project:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Experience added successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-experience", AddPortfolioExperiences);

/**
 * @swagger
 * /api/portfolio/get-portfolio-experiences:
 *   post:
 *     summary: Get all experience entries for an admin
 *     tags:
 *       - Portfolio (Experience)
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
 *         description: Experiences fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-experiences", GetPortfolioExperiences);

/**
 * @swagger
 * /api/portfolio/update-portfolio-experience:
 *   post:
 *     summary: Update an existing experience entry
 *     tags:
 *       - Portfolio (Experience)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               expId:
 *                 type: string
 *               company:
 *                 type: string
 *               role:
 *                 type: string
 *               period:
 *                 type: string
 *               project:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Experience updated successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin or experience not found
 *       500:
 *         description: Server error
 */
router.post("/update-portfolio-experience", UpdatePortfolioExperiences);

/**
 * @swagger
 * /api/portfolio/delete-portfolio-experience:
 *   post:
 *     summary: Delete an experience entry
 *     tags:
 *       - Portfolio (Experience)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               expId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Experience deleted successfully
 *       400:
 *         description: Admin ID and Experience ID required
 *       404:
 *         description: Admin or experience not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-experience", DeletePortfolioExperiences);
/**
 * @swagger
 * /api/portfolio/save-portfolio-service:
 *   post:
 *     summary: Add a new service entry
 *     tags:
 *       - Portfolio (Service)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               title:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service added successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-service", AddPortfolioServices);

/**
 * @swagger
 * /api/portfolio/get-portfolio-services:
 *   post:
 *     summary: Get all service entries for an admin
 *     tags:
 *       - Portfolio (Service)
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
 *         description: Services fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-services", GetPortfolioServices);

/**
 * @swagger
 * /api/portfolio/update-portfolio-service:
 *   post:
 *     summary: Update an existing service entry
 *     tags:
 *       - Portfolio (Service)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *               title:
 *                 type: string
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin or service not found
 *       500:
 *         description: Server error
 */
router.post("/update-portfolio-service", UpdatePortfolioServices);

/**
 * @swagger
 * /api/portfolio/delete-portfolio-service:
 *   post:
 *     summary: Delete a service entry
 *     tags:
 *       - Portfolio (Service)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               serviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       400:
 *         description: Admin ID and Service ID required
 *       404:
 *         description: Admin or service not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-service", DeletePortfolioServices);
/**
 * @swagger
 * /api/portfolio/save-portfolio-project:
 *   post:
 *     summary: Add a new project entry
 *     tags:
 *       - Portfolio (Project)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               role:
 *                 type: string
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               codeLink:
 *                 type: string
 *               previewLink:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project added successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-project", AddPortfolioProjects);

/**
 * @swagger
 * /api/portfolio/get-portfolio-projects:
 *   post:
 *     summary: Get all project entries for an admin
 *     tags:
 *       - Portfolio (Project)
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
 *         description: Projects fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-projects", GetPortfolioProjects);

/**
 * @swagger
 * /api/portfolio/update-portfolio-project:
 *   post:
 *     summary: Update an existing project entry
 *     tags:
 *       - Portfolio (Project)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               role:
 *                 type: string
 *               image:
 *                 type: string
 *               description:
 *                 type: string
 *               codeLink:
 *                 type: string
 *               previewLink:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: All fields are required
 *       404:
 *         description: Admin or project not found
 *       500:
 *         description: Server error
 */
router.post("/update-portfolio-project", UpdatePortfolioProjects);

/**
 * @swagger
 * /api/portfolio/delete-portfolio-project:
 *   post:
 *     summary: Delete a project entry
 *     tags:
 *       - Portfolio (Project)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Admin ID and Project ID required
 *       404:
 *         description: Admin or project not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-project", DeletePortfolioProjects);
/**
 * @swagger
 * /api/portfolio/save-portfolio-contact:
 *   post:
 *     summary: Add a new contact info entry
 *     tags:
 *       - Portfolio (Contact Info)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               company:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               mapEmbedUrl:
 *                 type: string
 *               socialMedia:
 *                 type: object
 *     responses:
 *       201:
 *         description: Contact info added successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-contact-info", AddPortfolioContactInfo);

/**
 * @swagger
 * /api/portfolio/get-portfolio-contact:
 *   post:
 *     summary: Get all contact info entries for an admin
 *     tags:
 *       - Portfolio (Contact Info)
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
 *         description: Contact info fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-contact-info", GetPortfolioContactInfo);

/**
 * @swagger
 * /api/portfolio/update-portfolio-contact:
 *   post:
 *     summary: Update an existing contact info entry
 *     tags:
 *       - Portfolio (Contact Info)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               contactInfoId:
 *                 type: string
 *               company:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               mapEmbedUrl:
 *                 type: string
 *               socialMedia:
 *                 type: object
 *     responses:
 *       200:
 *         description: Contact info updated successfully
 *       400:
 *         description: Required fields missing
 *       404:
 *         description: Admin or Contact Info not found
 *       500:
 *         description: Server error
 */
router.post("/update-portfolio-contact-info", UpdatePortfolioContactInfo);

/**
 * @swagger
 * /api/portfolio/delete-portfolio-contact:
 *   post:
 *     summary: Delete a contact info entry
 *     tags:
 *       - Portfolio (Contact Info)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               contactInfoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact info deleted successfully
 *       400:
 *         description: Admin ID and Contact Info ID required
 *       404:
 *         description: Admin or contact info not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-contact-info", DeletePortfolioContactInfo);
/**
 * @swagger
 * /api/portfolio/save-portfolio-message/{slug}:
 *   post:
 *     summary: Save a new contact message for portfolio (slug-based)
 *     tags:
 *       - Portfolio (Messages)
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
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
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message saved successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/save-portfolio-message/:slug", SaveContactMessage);
/**
 * @swagger
 * /api/portfolio/get-portfolio-messages:
 *   post:
 *     summary: Get all portfolio messages for an admin
 *     tags:
 *       - Portfolio (Messages)
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
 *         description: Messages fetched successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post("/get-portfolio-messages", GetAllContactMessages);
/**
 * @swagger
 * /api/portfolio/delete-portfolio-message:
 *   post:
 *     summary: Delete a portfolio message
 *     tags:
 *       - Portfolio (Messages)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *               messageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         description: Admin or message not found
 *       500:
 *         description: Server error
 */
router.post("/delete-portfolio-message", deleteContactMessage);

export default router;
