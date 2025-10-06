import express from "express";
import {
  GetInvoiceList,
  getTemplateById,
} from "../Controllers/InvoiceController.js";

const router = express.Router();

/**
 * @swagger
 * /api/invoice/get-template-list:
 *   post:
 *     summary: All Type List
 *     tags:
 *       - Invoice
 *     requestBody:
 *       content:
 *         application/json:
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request or missing required fields
 *       500:
 *         description: Server error
 */
router.post("/get-template-list", GetInvoiceList);
router.post("/get-template-by-id", getTemplateById);

export default router;
