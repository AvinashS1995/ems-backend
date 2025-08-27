const payslipEmailTemplate = ({ monthYear, employeeName, salary, leave }) => `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background:#f0f2f5; padding:30px;">
  <div style="max-width:700px; margin:auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:#4a90e2; color:#fff; padding:25px 30px; text-align:center;">
      <h1 style="margin:0; font-size:28px;">Payslip - ${monthYear}</h1>
      <p style="margin:5px 0 0 0; font-size:16px;">Hello <strong>${employeeName}</strong></p>
    </div>

    <!-- Summary Cards -->
    <div style="display:flex; justify-content:space-around; padding:20px; background:#f9f9f9;">
      <div style="text-align:center; padding:15px; background:#eaf4ff; border-radius:8px; flex:1; margin:0 5px;">
        <p style="margin:0; font-size:14px; color:#555;">Gross Salary</p>
        <p style="margin:5px 0 0 0; font-size:20px; font-weight:bold; color:#4a90e2;">₹${
          salary.gross
        }</p>
      </div>
      <div style="text-align:center; padding:15px; background:#fff4e5; border-radius:8px; flex:1; margin:0 5px;">
        <p style="margin:0; font-size:14px; color:#555;">Deductions</p>
        <p style="margin:5px 0 0 0; font-size:20px; font-weight:bold; color:#e67e22;">₹${
          salary.totalDeductions
        }</p>
      </div>
      <div style="text-align:center; padding:15px; background:#e6ffed; border-radius:8px; flex:1; margin:0 5px;">
        <p style="margin:0; font-size:14px; color:#555;">Net Pay</p>
        <p style="margin:5px 0 0 0; font-size:20px; font-weight:bold; color:#27ae60;">₹${
          salary.net
        }</p>
      </div>
    </div>

    <!-- Detailed Table -->
    <div style="padding:20px 30px;">
      <h2 style="font-size:18px; border-bottom:2px solid #f0f2f5; padding-bottom:10px;">Salary Details</h2>
      <table style="width:100%; border-collapse:collapse; margin-top:15px;">
        <tr style="background:#f0f2f5; font-weight:bold;">
          <th style="padding:10px; text-align:left; border:1px solid #ddd;">Component</th>
          <th style="padding:10px; text-align:right; border:1px solid #ddd;">Amount (₹)</th>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Basic</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            salary.basic
          }</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">HRA</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            salary.hra
          }</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Conveyance</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            salary.otherAllowance
          }</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">Special Allowance</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            salary.special
          }</td>
        </tr>
        <tr style="background:#f0f2f5; font-weight:bold;">
          <td style="padding:10px; border:1px solid #ddd;">Paid Days</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            salary.paidDays
          }</td>
        </tr>
        <tr style="background:#f0f2f5; font-weight:bold;">
          <td style="padding:10px; border:1px solid #ddd;">Available Leave</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">${
            leave.total
          }</td>
        </tr>
      </table>

      <p style="margin-top:20px; font-size:15px;">For the complete payslip including all deductions and allowances, please refer to the attached PDF.</p>
      <p style="margin-top:20px;">Best Regards,<br/><strong>HR Department</strong></p>
    </div>

    <!-- Footer -->
    <div style="background:#f0f2f5; text-align:center; padding:15px; font-size:12px; color:#888;">
      &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
    </div>
  </div>
</div>
`;

export default payslipEmailTemplate;
