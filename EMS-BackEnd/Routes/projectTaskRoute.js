import express from "express";
import {
  approveRejectProject,
  approveRejectTask,
  createProject,
  createTask,
  getProjects,
  getTasksByProject,
  updateTaskStatus,
} from "../Controllers/ProjectTaskController.js";

const router = express.Router();

/**
 * @swagger
 * /api/project/create-project:
 *   post:
 *     summary: Create a new Project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               deadline:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *               priority:
 *                 type: string
 *               deliverables:
 *                 type: string
 *               milestones:
 *                 type: string
 *               createdBy:
 *                 type: object
 *                 properties:
 *                   empNo:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *               assignTo:
 *                 type: object
 *                 properties:
 *                   empNo:
 *                     type: string
 *                   name:
 *                     type: string
 *                   designation:
 *                     type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/create-project", createProject);

/**
 * @swagger
 * /api/project/create-task:
 *   post:
 *     summary: Create a new Task under a Project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               deadline:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *               priority:
 *                 type: string
 *               expectedOutput:
 *                 type: string
 *               deliverables:
 *                 type: string
 *               milestones:
 *                 type: string
 *               status:
 *                 type: string
 *               assignTo:
 *                 type: object
 *                 properties:
 *                   empNo:
 *                     type: string
 *                   name:
 *                     type: string
 *                   designation:
 *                     type: string
 *               createdBy:
 *                 type: object
 *                 properties:
 *                   empNo:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post("/create-task", createTask);
/**
 * @swagger
 * /api/project/update-task-status:
 *   post:
 *     summary: Update Task Status under a Project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *               taskId:
 *                 type: string
 *               status:
 *                 type: string
 *               createdBy:
 *                 type: object
 *                 properties:
 *                   empNo:
 *                     type: string
 *                   name:
 *                     type: string
 *                   role:
 *                     type: string
 *     responses:
 *       200:
 *         description: Task Updated successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.post("/update-task-status", updateTaskStatus);

/**
 * @swagger
 * /api/project/projects:
 *   post:
 *     summary: Get all projects (role-based filtering can be applied in backend)
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Projects fetched successfully
 *       500:
 *         description: Internal server error
 */
router.post("/projects", getProjects);
/**
 * @swagger
 * /api/project/project-assign-approve-reject:
 *   post:
 *     summary: Project Assign Approve Reject
 *     tags:
 *       - Project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *               action:
 *                 type: string
 *               comments:
 *                 type: string
 *               approverEmpNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project Assign Approve Reject successfully !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/project-assign-approve-reject", approveRejectProject);

/**
 * @swagger
 * /api/project/tasks:
 *   post:
 *     summary: Get all tasks for a project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tasks fetched successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.post("/tasks", getTasksByProject);
/**
 * @swagger
 * /api/project/project-assign-approve-reject:
 *   post:
 *     summary: Project Assign Approve Reject
 *     tags:
 *       - Project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *               taskId:
 *                 type: string
 *               action:
 *                 type: string
 *               comments:
 *                 type: string
 *               approverEmpNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task Assign Approve Reject successfully !
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/task-assign-approve-reject", approveRejectTask);

export default router;
