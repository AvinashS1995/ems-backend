import express from "express";
import {
  createMonthlyPayslip,
  getAllEmployeeMonthlyPayslip,
} from "../Controllers/PayrollController.js";

const router = express.Router();

router.post("/generate-employee-monthly-payslip", createMonthlyPayslip);

/**
 * @swagger
 * /api/payroll/get-all-employee-monthly-payslip:
 *   post:
 *     summary: Get all employee payslips for a given month and year
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *               year:
 *                 type: integer
 *               empNo:
 *                 type: string
 *               page:
 *                 type: integer
 *               limit:
 *                 type: integer
 *     responses:
 *       200:
 *         description: List of employee payslips
 *       400:
 *         description: Missing month or year
 *       500:
 *         description: Internal server error
 */

router.post("/get-all-employee-monthly-payslip", getAllEmployeeMonthlyPayslip);

export default router;
