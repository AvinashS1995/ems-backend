import { imageToBase64 } from "../common/imageToBase64.js";
import path from "path";

const companyLogo = imageToBase64(path.join("assets", "company-logo.png"));
const poweredByLogo = imageToBase64(path.join("assets", "powered-by.png"));

export const monthlyPayslipTemplate = ({
  monthYear,
  payDate,
  company = {
    name: "EMS AS IT Technologies Ltd",
    address: "Powai Mumbai, Maharashtra 400001 India",
    logo: companyLogo,
  },
  employee,
  salary,
  leave,
}) => {
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Payslip - ${monthYear}</title>
  <meta http-equiv="Content-Security-Policy" content="img-src * data: blob:; default-src 'self' 'unsafe-inline' *">
  <style>
    /* Compact & professional */
    @font-face {
      font-family: 'Roboto';
      font-style: normal;
      font-weight: 400;
      src: local('Roboto'), local('Arial');
    }

       /* Page Border */
    body {
      font-family: 'Roboto', Arial, sans-serif;
      font-size: 12px;
      margin: 0;   
      color: #333;
      border: 2px solid #000; /* page border */
      padding: 20px;          /* spacing inside border */
      position: relative;     /* for watermark positioning */
      min-height: 90vh;
    }
      /* Watermark */
    body::after {
      content: "${company.name}";
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 60px;
      font-weight: bold;
      color: rgba(0,0,0,0.07); /* light watermark */
      white-space: nowrap;
      z-index: 0;
      pointer-events: none;
      user-select: none;
    }
 /* Ensure content appears above watermark */
    * {
      position: relative;
      z-index: 1;
    }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
    .company { font-size: 18px; font-weight: bold; line-height: 1.4; }
    .company small { font-size: 15px; font-weight: bold; line-height: 1.4; font-style: italic; }
    .subtitle { text-align: right; font-size: 14px; font-weight: bold; }
    .subtitle small { font-weight: normal; color: #777; }

    .summary-section { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; gap: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
    .summary-box { flex: 1; }
    .summary-title { font-weight: bold; font-size: 14px; color: #444; margin-bottom: 6px; }
    .summary { width: 100%; border-collapse: collapse; font-size: 13px; }
    .summary td { padding: 5px 8px; }
    .summary td:first-child { font-weight: bold; width: 150px; }

    .net-box { width: 220px; border: 1px solid #dceedd; background: #f6fdf6; border-radius: 8px; padding: 15px 20px; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .net-header { display: flex; align-items: center; margin-bottom: 10px; }
    .net-header .bar { width: 4px; height: 40px; background: #28a745; border-radius: 2px; margin-right: 10px; }
    .net-header .amount { font-size: 22px; font-weight: bold; color: #1c7c2f; }
    .net-header .label { font-size: 12px; color: #666; }
    .net-divider { border-top: 1px dotted #ccc; margin: 8px 0; }
    .net-details { display: flex; flex-direction: column; gap: 6px; }
    .net-details div { display: flex; justify-content: space-between; font-size: 13px; }
    .net-details strong { font-weight: bold; }

    .details { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    .details td { padding: 6px 10px; border-bottom: 1px solid #f2f2f2; }
    .details td:first-child { font-weight: bold; }

    .earnings { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    .earnings th, .earnings td { border: 1px solid #ddd; padding: 8px; }
    .earnings th { background: #f4f6f8; font-weight: bold; text-align: left; }
    .earnings tr:last-child th { background: #f9f9f9; }

    .net-payable { display: flex; justify-content: space-between; align-items: stretch; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; overflow: hidden; }
    .net-payable-left { padding: 12px 16px; flex: 1; }
    .net-payable-left h4 { margin: 0; font-weight: 600; font-size: 11px; }
    .net-payable-left small { color: #555; font-size: 9px; }
    .net-payable-right { background: #e9f9eb; padding: 12px 20px; display: flex; align-items: center; justify-content: center; min-width: 180px; font-weight: bold; font-size: 13px; color: #1c7c2f; border-left: 1px solid #ddd; }

    .amount-words { margin-top: 10px; font-size: 11px; text-align: right; }
    .amount-words span { font-weight: 600; font-style: italic; }

    .divider { border-top: 1px solid #ddd; margin: 20px 0; }
    .system-note { text-align: center; font-size: 12px; color: #777; margin: 15px 0; font-style: italic; }

    .footer-powered { text-align: center; font-size: 12px; color: #555; margin-top: 20px; }
    .footer-powered img { height: 16px; vertical-align: middle; margin: 0 4px; }
    .footer-powered a { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <img src="${
        company.logo
      }" alt="Logo" style="height: 50px; vertical-align: middle; margin-right: 10px"/>
      ${company.name} <br/>
      <small>${company.address}</small>
    </div>
    <div class="subtitle">
      Payslip For the Month <br/>
      <small>${monthYear}</small>
    </div>
  </div>

  <div class="summary-section">
    <div class="summary-box">
      <div class="summary-title">EMPLOYEE SUMMARY</div>
      <table class="summary">
        <tr><td>Employee Name</td><td>${fullName}</td></tr>
        <tr><td>Employee ID</td><td>${employee.employeeId}</td></tr>
        <tr><td>Designation</td><td>${employee.designation}</td></tr>
        <tr><td>Department</td><td>${employee.department || "-"}</td></tr>
        <tr><td>Location</td><td>${employee.location || "-"}</td></tr>
        <tr><td>Pay Period</td><td>${monthYear}</td></tr>
        <tr><td>Pay Date</td><td>${payDate}</td></tr>
      </table>
    </div>

    <div class="net-box">
      <div class="net-header">
        <div class="bar"></div>
        <div>
          <div class="amount">Rs.${salary.net}</div>
          <div class="label">Total Net Pay</div>
        </div>
      </div>

      <div class="net-divider"></div>

      <div class="net-details">
        <div><span>Paid Days</span><strong>${salary.paidDays}</strong></div>
      </div>

      <div class="net-divider"></div>

      <div class="net-details">
        <strong style="font-size:12px; color:#444;">Monthly Leave Balance</strong>
        <div><span>Total Leaves</span><strong>${leave.total}</strong></div>
        <div><span>Leaves Taken</span><strong>${leave.taken}</strong></div>
        <div><span>Remaining</span><strong>${leave.remaining}</strong></div>
      </div>
    </div>
  </div>

  <table class="details">
    <tr><td>Bank</td><td>${employee.bankName || "-"}</td><td>Bank A/C</td><td>${
    employee.bankAccNo || "-"
  }</td></tr>
    <tr><td>PF No</td><td>${employee.pfNo || "-"}</td><td>UAN</td><td>${
    employee.uan || "-"
  }</td></tr>
    <tr><td>PAN No</td><td>${employee.pan || "-"}</td><td></td><td></td></tr>
  </table>

  <table class="earnings">
    <tr><th>Earnings</th><th>Amount</th><th>Deductions</th><th>Amount</th></tr>
    <tr><td>Basic</td><td>Rs.${
      salary.basic
    }</td><td>Provident Fund</td><td>Rs.${salary.pf}
  </td></tr>
    <tr><td>House Rent Allowance</td><td>Rs.${
      salary.hra
    }</td><td>Professional Tax</td><td>Rs.${salary.profTax}</td></tr>
    <tr><td>Special/Compensatory</td><td>Rs.${
      salary.special
    }</td><td></td><td></td></tr>
    <tr><td>Other Allowance</td><td>Rs.${
      salary.otherAllowance
    }</td><td></td><td></td></tr>
    <tr><th>Gross Earnings</th><th>Rs.${
      salary.gross
    }</th><th>Total Deductions</th><th>Rs.${salary.totalDeductions}</th></tr>
  </table>

  <div class="net-payable">
    <div class="net-payable-left">
      <h4>TOTAL NET PAYABLE</h4>
      <small>Gross Earnings - Total Deductions</small>
    </div>
    <div class="net-payable-right">Rs.${salary.net}</div>
  </div>

  <div class="amount-words">
    Amount In Words : <span>${salary.netInWords}</span>
  </div>

  <div class="divider"></div>
  <div class="system-note">-- This is a system-generated document. --</div>

  <div class="footer-powered">
    Powered by <img src="${poweredByLogo}" alt="logo">
    EMS Payroll &nbsp; | &nbsp; Simplify payroll and compliance. Visit
    <a href="https://ems-project-kappa.vercel.app/payroll">ems-project-kappa.vercel.app</a>
  </div>
</body>
</html>`;
};
