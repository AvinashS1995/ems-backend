import { imageToBase64 } from "../common/imageToBase64.js";
import path from "path";

const companyLogo = imageToBase64(path.join("assets", "company-logo.png"));
const poweredByLogo = imageToBase64(path.join("assets", "powered-by.png"));

/**
 * ENTERPRISE 2‑PAGE OFFER LETTER (with Annexures)
 */
export const offerLetterTemplate = ({
  issueDate,
  joiningDate,
  company = {
    name: "EMS AS IT Technologies Ltd",
    address: "Powai Mumbai, Maharashtra 400001 India",
    logo: companyLogo,
  },
  employee,
  salary,
  policy = {
    workHours: "9:30 AM - 6:30 PM, Monday to Friday",
    noticePeriodProbation: "30 days",
    noticePeriodConfirmed: "90 days",
    leave,
    dressCode: "Smart Casuals (Client-meetings: Formal)",
  },
}) => {
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Offer Letter - ${fullName}</title>
  <meta http-equiv="Content-Security-Policy" content="img-src * data: blob:; default-src 'self' 'unsafe-inline' *">
  <style>
    /* Base / Page */
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; margin: 0; border: 2px solid #000; padding: 24px; position: relative; min-height: 96vh; }
    body::after { content: "${company.name}"; position: fixed; top: 45%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 60px; font-weight: bold; color: rgba(0,0,0,0.06); white-space: nowrap; z-index: 0; pointer-events: none; user-select: none; }
    * { position: relative; z-index: 1; }

    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
    .company { font-size: 18px; font-weight: bold; line-height: 1.4; }
    .company small { display: block; font-size: 13px; color: #555; }

    .meta { text-align: right; font-size: 12px; }
    .title { text-align: center; font-size: 18px; font-weight: bold; margin: 18px 0 12px; text-decoration: underline; }

    .block { margin-top: 12px; }
    .section-title { font-weight: bold; text-decoration: underline; margin: 18px 0 8px; font-size: 13px; color: #222; }
    p { margin: 8px 0; text-align: justify; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; }
    .kv td { padding: 6px 8px; border-bottom: 1px solid #f1f1f1; }
    .kv td:first-child { width: 160px; font-weight: bold; }

    .salary { margin-top: 8px; font-size: 12px; }
    .salary th, .salary td { border: 1px solid #ddd; padding: 8px; }
    .salary th { background: #f5f7fa; text-align: left; }
    .note { font-size: 11px; color: #555; }

    .callout { border: 1px solid #dbe7ff; background: #f5f9ff; padding: 10px 12px; border-radius: 6px; }

    /* Signature */
    .sign-row { display: flex; justify-content: space-between; gap: 24px; margin-top: 28px; }
    .sign { flex: 1; padding-top: 28px; text-align: center; border-top: 1px dashed #aaa; }

    /* Footer */
    .footer-powered { text-align: center; font-size: 11px; color: #555; margin-top: 18px; }
    .footer-powered img { height: 14px; vertical-align: middle; margin: 0 4px; }
    .footer-powered a { color: #0066cc; text-decoration: none; }

    /* Page Breaks */
    .page-break { page-break-before: always; }
    @media print { .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="header">
    <div class="company">
      <img src="${company.logo}" alt="Logo" style="height: 48px; vertical-align: middle; margin-right: 10px;"/>
      ${company.name}
      <small>${company.address}</small>
    </div>
    <div class="meta">
      <div><strong>Date:</strong> ${issueDate}</div>
    </div>
  </div>

  <div class="title">OFFER OF EMPLOYMENT</div>

  <div class="block">
    <p><strong>To,</strong><br/>
      ${fullName}<br/>
      ${employee.address}
    </p>
    <p><strong>Subject:</strong> Appointment as ${employee.designation}</p>
    <p>Dear <strong>${fullName}</strong>,</p>
    <p>We are pleased to offer you the position of <strong>${employee.designation}</strong> in the <strong>${employee.department}</strong> at our <strong>${employee.location}</strong> office. Your expected date of joining is <strong>${joiningDate}</strong>. You will be on probation for a period of <strong>${salary.probation}</strong>, post which your performance will be reviewed for confirmation.</p>
  </div>

  <div class="block">
    <div class="section-title">1. Compensation Summary</div>
    <p>Your annual Cost to Company (CTC) will be <strong>Rs. ${salary.ctc}</strong>. The broad breakup is provided below. A detailed annexure follows.</p>
    <table class="salary">
      <tr><th>Earnings</th><th>Annual (INR)</th><th>Deductions / Employer Costs</th><th>Annual (INR)</th></tr>
      <tr><td>Basic</td><td>${salary.yearly.basic}</td><td>Provident Fund</td><td>${salary.yearly.pf}</td></tr>
      <tr><td>House Rent Allowance</td><td>${salary.yearly.hra}</td><td>Professional Tax</td><td>${salary.yearly.professionalTax}</td></tr>
      <tr><td>Special / Compensatory Allowance</td><td>${salary.yearly.specialAllowance}</td><td></td><td></td></tr>
      <tr><td>Other Allowance</td><td>${salary.yearly.otherAllowance}</td><td></td><td></td></tr>
      <tr><th>Total Gross Earnings</th><th>${salary.yearly.gross}</th><th>Total Deductions</th><th>${salary.yearly.totalDeductions}</th></tr>
      <tr><th colspan="3">Estimated Net (Post Deductions)</th><th>${salary.yearly.net}</th></tr>
    </table>
    <p class="note">Note: Actual in-hand salary is subject to statutory changes and individual tax declarations. Bonus, if applicable, is governed by the company bonus policy.</p>
  </div>

  <div class="block">
    <div class="section-title">2. Key Terms & Conditions</div>
    <div class="callout">
      <ul>
        <li><strong>Probation:</strong> ${salary.probation}. May be extended at the company’s discretion with written intimation.</li>
        <li><strong>Working Hours:</strong> ${policy.workHours}. Hybrid/remote schedules may be assigned per business needs.</li>
        <li><strong>Notice Period:</strong> During probation: ${policy.noticePeriodProbation}. After confirmation: ${policy.noticePeriodConfirmed}. Company may relieve earlier by adjusting salary in lieu.</li>
        <li><strong>Leaves:</strong> Entitlement as per policy (${policy.leaveBreakup}). Unused leave carry-forward/encashment as per HR policy.</li>
        <li><strong>Confidentiality & IP:</strong> You shall protect confidential information and assign to the company any work-related intellectual property created during employment.</li>
        <li><strong>Non-Solicit & Fair Competition:</strong> For 12 months post-separation, you shall not solicit company employees, clients, or interfere with business relationships.</li>
        <li><strong>Background Verification:</strong> This offer is contingent upon satisfactory verification of credentials and documents submitted.</li>
        <li><strong>Code of Conduct:</strong> You shall adhere to professional behavior, anti‑harassment, ethics, and compliance standards at all times.</li>
        <li><strong>IT & Data Security:</strong> Comply with acceptable use, device protection, password, and data privacy requirements (including client NDA obligations).</li>
        <li><strong>Location & Transferability:</strong> You may be assigned to any company location/client site domestically or internationally, based on project needs.</li>
      </ul>
    </div>
  </div>

  <div class="block">
    <div class="section-title">3. Acceptance</div>
    <p>Please sign below and return a copy as your acceptance of the terms of this offer and the attached annexures.</p>
  </div>

  <div class="sign-row">
    <div class="sign">For ${company.name}<br/><br/><br/>Authorized Signatory</div>
    <div class="sign">Accepted by<br/><br/><br/>${fullName}</div>
  </div>

  <div class="footer-powered">
    Powered by <img src="${poweredByLogo}" alt="logo"> EMS Payroll &nbsp;|&nbsp;
    <a href="https://ems-project-kappa.vercel.app/payroll">ems-project-kappa.vercel.app</a>
  </div>

  <!-- PAGE 2 (ANNEXURES) -->
  <div class="page-break"></div>

  <div class="title">ANNEXURE A - Detailed Salary Structure</div>
  <p>The table below provides an indicative monthly and annual breakup for your reference (amounts in INR):</p>
  <table class="salary">
    <tr>
      <th>Component</th>
      <th>Monthly</th>
      <th>Annual</th>
      <th>Remarks</th>
    </tr>
    <tr><td>Basic</td><td>${salary.monthly.basic}</td><td>${salary.yearly.basic}</td><td>Fixed base pay (40% of CTC)</td></tr>
    <tr><td>House Rent Allowance (HRA)</td><td>${salary.monthly.hra}</td><td>${salary.yearly.hra}</td><td>Provided for rental/living expenses (tax exempt as per IT rules)</td></tr>
    <tr><td>Special / Compensatory</td><td>${salary.monthly.specialAllowance}</td><td>${salary.yearly.specialAllowance}</td><td>Flexible component balancing the structure</td></tr>
    <tr><td>Other Allowances</td><td>${salary.monthly.otherAllowance}</td><td>${salary.yearly.otherAllowance}</td><td>Meal, travel, telephone or company policy-based</td></tr>
    <tr><td><strong>Gross Earnings</strong></td><td>${salary.monthly.gross}</td><td><strong>${salary.yearly.gross}</strong></td><td>Total before statutory deductions</td></tr>
    <tr><td>Employee Profident Fund</td><td>${salary.monthly.pf}</td><td>${salary.yearly.pf}</td><td>12% of Basic; deducted from employee salary</td></tr>
    <tr><td>Employer Provident Fund (EPF + EPS)</td><td>${salary.monthly.employerContribution.total}</td><td>${salary.yearly.employerContribution.total}</td><td>12% of Basic; contributed by company (part of CTC)</td></tr>
    <tr><td>Professional Tax</td><td>${salary.monthly.professionalTax}</td><td>${salary.yearly.professionalTax}</td><td>As per state laws; deducted monthly</td></tr>
    <tr><td><strong>Estimated Net (Annual)</strong></td><td>${salary.monthly.net}</td><td><strong>${salary.yearly.net}</strong></td><td>Take-home after statutory deductions</td></tr>
  </table>
  <p class="note">Exact figures will be computed in payroll based on statutory rules, tax regime opted, and proofs submitted by you.</p>

  <div class="section-title">Payment & Reimbursement</div>
  <ul>
    <li>Salary is paid monthly via bank transfer on or before the last working day.</li>
    <li>Approved reimbursements must be claimed with valid invoices within 60 days.</li>
    <li>Deductions such as Provident Fund (Employee share), Professional Tax (if applicable), and TDS under the Income Tax Act will be made from your salary.</li>
    <li>The Company separately contributes its Employer share of Provident Fund (EPF/EPS), which is not deducted from your salary but is included in the CTC as part of statutory benefits.</li>
  </ul>

  <div class="section-title">ANNEXURE B - Company Policies (Summary)</div>
  <p>Please read and adhere to all current and future policies published on the HR portal. Key highlights:</p>
  <ul>
    <li><strong>Attendance & Leave:</strong> Mark attendance daily. Leave requests via HRMS prior to availing (emergency exceptions allowed).</li>
    <li><strong>Code of Conduct:</strong> Maintain professionalism, respect, and integrity. Zero tolerance to harassment/discrimination.</li>
    <li><strong>Information Security:</strong> Protect credentials, use licensed software, encrypt devices, and report incidents immediately.</li>
    <li><strong>Asset Usage:</strong> Company assets (laptop, phone, ID) are for business use; return upon exit.</li>
    <li><strong>External Communication:</strong> Do not make public statements or share company/client data without authorization.</li>
    <li><strong>Conflict of Interest:</strong> Disclose any secondary employment, freelancing, or vendor relationships in writing.</li>
    <li><strong>Health & Safety:</strong> Follow safety instructions while on premises or client sites.</li>
  </ul>

  <div class="section-title">Documents Required at Joining</div>
  <ul>
    <li>Government ID (PAN, Aadhaar/Passport), Address Proof, 2 Passport Photos</li>
    <li>Educational certificates and mark sheets</li>
    <li>Relieving letter / experience certificates from previous employer(s)</li>
    <li>Cancelled cheque / bank details</li>
  </ul>

  <div class="section-title">Acceptance & Declarations</div>
  <p>By signing the main letter, you acknowledge that you have read and agree to these annexures. Any misrepresentation may lead to withdrawal of the offer or termination.</p>

  <div class="sign-row">
    <div class="sign">For ${company.name}<br/><br/><br/>Authorized Signatory</div>
    <div class="sign">I, ${fullName}, accept the offer and policies herein.<br/><br/><br/>Signature of Employee</div>
  </div>

  <div class="footer-powered">
    Powered by <img src="${poweredByLogo}" alt="logo"> EMS Payroll &nbsp;|&nbsp;
    <a href="https://ems-project-kappa.vercel.app/payroll">ems-project-kappa.vercel.app</a>
  </div>
</body>
</html>`;
};
