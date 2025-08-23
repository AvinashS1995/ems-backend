// src/cron/payrollCron.js
import cron from "node-cron";
import axios from "axios";
import dotenv from "dotenv";
import { User } from "../Models/UserModel.js";
dotenv.config({ path: "./.env" });

/**
 * Example CRON:
 * Runs at 09:00 on the 1st of every month (server time).
 * You can loop employees in your DB; here we call an internal API for each.
 */
export const scheduleMonthlyPayslips = async (getEmployeeList) => {
  // cron.schedule("0 9 1 * *", async () => {
  try {
    const monthYear = new Date().toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const employees = await User.find({ status: "Active" }); // e.g., () => User.find({ active: true })
    // console.log(employees);
    for (const e of employees) {
      // Get salary breakup from your payroll logic/service
      const salary = await buildSalaryFor(e, monthYear); // implement per your rules
      const leave = await buildLeaveSummaryFor(e, monthYear); // implement

      await axios.post(
        `http://localhost:${process.env.PORT}/api/payroll/generate-employee-monthly-payslip`,
        {
          email: e.email,
          monthYear,
          salary,
          leave,
        },
        {
          headers: { "x-internal-cron": process.env.CRON_SECRET },
        }
      );
    }
    console.log("Monthly payslips triggered.");
  } catch (err) {
    console.error("Cron payslip error:", err);
  }
  // });
};

// Dummy helpers to illustrate; replace with real logic.
const buildSalaryFor = async (e, monthYear) => ({
  basic: 25000,
  hra: 11000,
  conveyance: 1600,
  special: 4500,
  gross: 52850,
  pf: 3000,
  profTax: 200,
  tax: 0,
  deductions: 3200,
  net: 49650,
  paidDays: 12,
});
const buildLeaveSummaryFor = async (e, monthYear) => ({
  total: 2,
  taken: 1,
  remaining: 1,
});

export default function startMonthlyPayslipCron() {
  // Run every day at 11:00 AM, check if today is last working day
  cron.schedule("0 11 * * *", async () => {
    const today = moment();
    let lastDay = moment().endOf("month");

    // Adjust if last day is weekend
    while (lastDay.day() === 0 || lastDay.day() === 6) {
      lastDay.subtract(1, "days");
    }

    if (today.isSame(lastDay, "day")) {
      console.log("[CRON] Last working day, generating payslips...");
      await scheduleMonthlyPayslips();
    } else {
      console.log("[CRON] Not last working day, skipping...");
    }
  });
  // Optional: run immediately at startup
  // scheduleMonthlyPayslips();
}
