import puppeteer from "puppeteer";
import moment from "moment";
import dotenv from "dotenv";
import transporter from "../mail/transporter.js";
import { User } from "../Models/UserModel.js";
import { monthlyPayslipTemplate } from "../common/payslipTemplate.js";
import { formatINR, numberToINRWords } from "../common/currency.js";
import { getPresignedUrl, s3Client } from "../storage/s3.config.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import payslipEmailTemplate from "../mail/sendMailforMonthlyPayslip.js";
import {
  EmployeeAnnuallySalaryBreakup,
  Payslip,
} from "../Models/payrollModel.js";
import path from "path";
import { Holidays } from "../Models/holidayModel.js";
import Attendance from "../Models/attendenceModel.js";

dotenv.config({ path: "./.env" });

const DEFAULT_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

// Check weekend
const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

/**
 * HTML -> PDF Buffer
 */
const htmlToPdfBuffer = async (html) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
  });
  await browser.close();
  return pdfBuffer;
};

/**
 * Send email with PDF buffer
 */
const sendPayslipEmail = async ({
  to,
  pdfBuffer,
  monthYear,
  employee,
  salary,
  leave,
}) => {
  const htmlContent = payslipEmailTemplate({
    monthYear,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    salary,
    leave,
  });

  await transporter.sendMail({
    from: `"HR Department" <${process.env.EMAIL_USER}>`,
    to,
    subject: `📄 Payslip - ${monthYear}`,
    html: htmlContent,
    attachments: [
      {
        filename: `Payslip-${monthYear}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
};

// --- Generate working days between two dates excluding weekends & holidays ---
const getWorkingDaysBetween = async (startDate, endDate) => {
  const holidays = await Holidays.find({
    date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
  });
  const holidaySet = new Set(
    holidays.map((h) => moment(h.date).format("YYYY-MM-DD"))
  );

  const workingDays = [];
  for (
    let m = moment(startDate);
    m.isSameOrBefore(endDate, "day");
    m.add(1, "days")
  ) {
    const dayStr = m.format("YYYY-MM-DD");
    if (!isWeekend(m.toDate()) && !holidaySet.has(dayStr))
      workingDays.push(dayStr);
  }
  return workingDays;
};

export const createMonthlyPayslip = async (req, res) => {
  try {
    const { email, monthYear, salary: rawSalary } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "Employee not found" });

    // --- Attendance logic ---
    const currentDate = moment();
    const startDate = moment(currentDate).subtract(1, "months").date(24); // 24th last month
    const endDate = moment(currentDate).date(23); // 23rd this month

    const workingDays = await getWorkingDaysBetween(startDate, endDate);

    const attendanceRecords = await Attendance.find({
      empNo: user.empNo,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    const presentDays = attendanceRecords
      .filter((a) => a.status === "Present")
      .map((a) => moment(a.date).format("YYYY-MM-DD"));

    const approvedLeaveDays = attendanceRecords
      .filter((a) => a.status === "Leave" && a.leaveType !== "LWP")
      .map((a) => moment(a.date).format("YYYY-MM-DD"));

    const lopDaysArr = attendanceRecords
      .filter((a) => a.status === "LWP" || a.status === "Absent")
      .map((a) => moment(a.date).format("YYYY-MM-DD"));

    const totalWorkingDays = workingDays.length;
    const totalPresentDays = presentDays.length;
    const totalPaidLeaveDays = approvedLeaveDays.length;
    const totalLopDays = lopDaysArr.length;
    const paidDays = totalPresentDays + totalPaidLeaveDays;

    // --- Fetch salary breakup from DB  ---
    const salaryBreakup = await EmployeeAnnuallySalaryBreakup.findOne({
      empNo: user.empNo,
    });

    if (!salaryBreakup) {
      return res
        .status(404)
        .json({ status: "fail", message: "Salary breakup not found" });
    }

    const monthlySalary = salaryBreakup.components.monthly;

    console.log(monthlySalary);

    // --- Pro-rate salary based on paid days ---
    const perDayBasic = (monthlySalary.basic || 0) / totalWorkingDays;
    const perDayHRA = (monthlySalary.hra || 0) / totalWorkingDays;
    const perDayOtherAllowance =
      (monthlySalary.otherAllowance || 0) / totalWorkingDays;
    const perDaySpecial =
      (monthlySalary.specialAllowance || 0) / totalWorkingDays;

    console.log(perDayBasic);

    const basic = perDayBasic * paidDays;
    const hra = perDayHRA * paidDays;
    const otherAllowance = perDayOtherAllowance * paidDays;
    const specialAllowance = perDaySpecial * paidDays;

    const gross = monthlySalary.gross * paidDays;

    const totalDeductions = monthlySalary.totalDeductions;
    const net = monthlySalary.net * paidDays;

    const salary = {
      basic: formatINR(basic),
      hra: formatINR(hra),
      otherAllowance: formatINR(otherAllowance),
      special: formatINR(specialAllowance),
      gross: formatINR(gross),
      pf: formatINR(monthlySalary.pf || 0),
      profTax: formatINR(monthlySalary.professionalTax || 0),
      totalDeductions: formatINR(totalDeductions),
      net: formatINR(net),
      netInWords: numberToINRWords(net),
      totalWorkingDays,
      presentDays: totalPresentDays,
      paidLeaveDays: totalPaidLeaveDays,
      lopDays: totalLopDays,
      paidDays,
    };

    console.log(salary);
    const leave = {
      total: totalWorkingDays,
      taken: totalLopDays,
      remaining: totalWorkingDays - paidDays,
    };

    const employee = {
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.empNo || user._id?.toString().slice(-6).toUpperCase(),
      designation: user.designation || "-",
      department: user.department || "-",
      location: user.location || "Mumbai",
      bankName: user.bankName || "ICICI BANK",
      bankAccNo: user.bankAccNo || "XXXXXXXX2310",
      pfNo: user.pfNo || "XXXXXXXX1234",
      uan: user.uan || "XXXXXXXX4321",
      pan: user.pan || "XXXXXXXA",
    };

    const payDate = moment().format("DD/MM/YYYY");

    // --- Generate PDF ---
    const html = monthlyPayslipTemplate({
      monthYear,
      payDate,
      employee,
      salary,
      leave,
    });
    const pdfBuffer = await htmlToPdfBuffer(html);

    const fileName = `${employee.employeeId}-${monthYear.replace(
      /\s+/g,
      "-"
    )}-Payslip.pdf`;
    const fileKey = `payslips/${employee.employeeId}/${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      })
    );

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.filebase.com/${fileKey}`;

    await sendPayslipEmail({
      to: email,
      pdfBuffer,
      monthYear,
      employee,
      salary,
      leave,
    });

    const payslipRecord = new Payslip({
      employeeId: employee.employeeId,
      email,
      name: `${employee.firstName} ${employee.lastName}`,
      designation: employee.designation,
      department: employee.department,
      bankName: employee.bankName,
      bankAccount: employee.bankAccNo,
      pfNo: employee.pfNo,
      uan: employee.uan,
      pan: employee.pan,
      periodMonth: moment(monthYear, "MMMM YYYY").month() + 1,
      periodYear: moment(monthYear, "MMMM YYYY").year(),
      payDate: new Date(),
      paidDays,
      lopDays: totalLopDays,
      earnings: [
        { label: "Basic", amount: basic },
        { label: "HRA", amount: hra },
        { label: "Other Allowance", amount: otherAllowance },
        { label: "Special", amount: specialAllowance },
      ],
      deductions: [
        { label: "PF", amount: parseFloat(salary.pf || 0) },
        {
          label: "Professional Tax",
          amount: parseFloat(salary.profTax || 0),
        },
        { label: "Income Tax", amount: parseFloat(salary.tax || 0) },
      ],
      grossEarnings: gross,
      totalDeductions,
      netPay: net,
      fileKey,
      fileUrl,
      emailedAt: new Date(),
    });

    await payslipRecord.save();

    return res
      .status(200)
      .json({ status: "success", message: "Payslip generated", fileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: "Error generating payslip",
      error: err.message,
    });
  }
};

export const getAllEmployeeMonthlyPayslip = async (req, res) => {
  try {
    const { month, year, employeeId, page, limit } = req.body;

    const filter = {};

    if (month && year) {
      filter.periodMonth = parseInt(month);
      filter.periodYear = parseInt(year);
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Payslip.countDocuments(filter);

    const payslips = await Payslip.find(filter)
      .sort({ periodYear: -1, periodMonth: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedPayslips = await Promise.all(
      payslips.map(async (p) => {
        let avatar = DEFAULT_AVATAR;
        let employeePayslipUrl = null;

        const user = await User.findOne({ empNo: p.employeeId }).lean();

        if (user?.profileImage) {
          try {
            avatar = await getPresignedUrl(user.profileImage);
          } catch (err) {
            console.warn(
              `Failed to get avatar presigned URL for ${p.employeeId}`,
              err.message
            );
          }
        }

        if (p.fileKey) {
          try {
            employeePayslipUrl = await getPresignedUrl(p.fileKey);
          } catch (err) {
            console.warn(
              `Failed to get payslip presigned URL for ${p.employeeId}`,
              err.message
            );
          }
        }

        return {
          employeeId: p.employeeId,
          email: p.email,
          name: p.name,
          designation: p.designation,
          department: p.department,
          bankName: p.bankName,
          bankAccount: p.bankAccount,
          pfNo: p.pfNo,
          uan: p.uan,
          pan: p.pan,
          periodMonth: p.periodMonth,
          periodYear: p.periodYear,
          grossEarnings: p.grossEarnings,
          totalDeductions: p.totalDeductions,
          netPay: p.netPay,
          fileKey: p.fileKey ? path.basename(p.fileKey) : null,
          fileUrl: employeePayslipUrl,
          emailedAt: p.emailedAt,
          avatar,
        };
      })
    );

    return res.status(200).json({
      status: "success",
      message: "Successfully Fetched!",
      totalRecords: total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: {
        formattedPayslips,
      },
    });
  } catch (err) {
    console.error("getAllEmployeeMonthlyPayslip error:", err);
    return res.status(500).json({
      status: "fail",
      message: err.message,
      error: err.message,
    });
  }
};
