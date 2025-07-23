import express from 'express';
import { AssignRoleMenus, CreateMenu, GetMenu, GetRoleMenus, UpdateMenu  } from '../Controllers/MenuController.js';
import { authenticateToken } from '../Middlewares/verifyTokenMiddleware.js';


const router = express.Router();

/**
 * @swagger
 * /api/menu/create-menu:
 *   post:
 *     summary: Create New Menu
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               path:
 *                 type: string
 *               componentName:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/create-menu', authenticateToken, CreateMenu)
/**
 * @swagger
 * /api/menu/getmenu:
 *   post:
 *     summary: Create New Menu
 *     tags:
 *       - Menu
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/getmenu', authenticateToken, GetMenu)
/**
 * @swagger
 * /api/menu/update-menu:
 *   post:
 *     summary: Update existing menu (parent or child)
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - menuId
 *             properties:
 *               menuId:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 description: Required only if updating a child menu
 *               title:
 *                 type: string
 *               path:
 *                 type: string
 *               componentName:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Menu not found
 *       500:
 *         description: Internal server error
 */
router.post('/update-menu', authenticateToken, UpdateMenu)

/**
 * @swagger
 * /api/menu/create-role-wise-menu:
 *   post:
 *     summary: Assign Role Wise Menu
 *     tags:
 *       - Menu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               menus:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuId:
 *                       type: string
 *                     access:
 *                       type: string
 *     responses:
 *       201:
 *         description: Menu created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/create-role-wise-menu', authenticateToken, AssignRoleMenus)
/**
 * @swagger
 * /api/menu/getrole-wise-menu:
 *   post:
 *     summary: All Role Wise Menu
 *     tags:
 *       - Menu
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
 *       201:
 *         description: Menu created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post('/getrole-wise-menu', authenticateToken, GetRoleMenus)



export default router;