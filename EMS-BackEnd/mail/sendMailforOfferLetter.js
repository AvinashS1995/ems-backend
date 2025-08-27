import { formatDate } from "../common/dateFormat.js";
import transporter from "./transporter.js";
import path from "path";

export const sendMailForEmployeeOfferLetter = async (
  company,
  employee,
  pdfBuffer
) => {
  // Send Email with PDF
  await transporter.sendMail({
    to: employee.email,
    subject: `🎉 Welcome to ${company.name}! Your Offer Letter is Ready`,
    // subject: `🎉 Congratulations ${employee.firstName} ${employee.lastName}! Your Offer Letter from ${company.name}`,
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; color:#333; padding:20px; background:#f5f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.1);">
      
      <!-- HEADER -->
      <tr style="background:${company.primaryColor || "#0a2e65"}; color:#fff;">
        <td style="padding:25px; text-align:center;">
          <img src="cid:companyLogo" alt="Company Logo" style="height:55px; margin-bottom:8px;" />
          <h1 style="margin:0; font-size:22px; font-weight:600; letter-spacing:0.5px;">
            ${company.name}
          </h1>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:30px 25px;">
          <h3 style="margin-top:0; color:${
            company.primaryColor || "#0a2e65"
          }; font-size:18px; font-weight:600;">
            Dear ${employee.firstName} ${employee.lastName},
          </h3>

          <p style="font-size:15px; line-height:1.7; margin:15px 0;">
            We are pleased to formally welcome you to <strong>${
              company.name
            }</strong>.  
            Your official <strong>Offer Letter</strong> has been attached for your review.
          </p>

          <p style="font-size:15px; line-height:1.7; margin:15px 0;">
            Your confirmed <strong>Joining Date</strong> is 
            <span style="color:${
              company.primaryColor || "#0a2e65"
            }; font-weight:600;">
              ${formatDate(employee.joiningDate)}
            </span>.  
            We are excited to have you onboard and look forward to a long and successful journey together.
          </p>

          <!-- CTA BUTTON -->
          <div style="text-align:center; margin:30px 0;">
            <a href="#" 
               style="background:${company.primaryColor || "#0a2e65"}; 
                      color:#fff; text-decoration:none; 
                      padding:14px 28px; 
                      border-radius:6px; 
                      font-size:15px; 
                      font-weight:600;
                      display:inline-block;
                      box-shadow:0 3px 6px rgba(0,0,0,0.15);">
              📄 View Offer Letter
            </a>
          </div>

          <p style="font-size:14px; color:#555; line-height:1.6;">
            If you have any questions or require further assistance, please feel free to reply to this email.
          </p>

          <p style="margin-top:25px; font-size:14px;">
            Sincerely,<br/>
            <strong>HR Team</strong><br/>
            ${company.name}
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr style="background:#f1f3f7;">
        <td style="padding:20px; text-align:center; font-size:12px; color:#666; line-height:1.4;">
          Powered by <strong>EMS Payroll</strong>  
          | <a href="https://ems-project-kappa.vercel.app/payroll" style="color:${
            company.primaryColor || "#0a2e65"
          }; text-decoration:none;">Visit Portal</a>  
          <br/><br/>
          <em>This communication is confidential and intended solely for the addressed recipient.  
          If you are not the intended recipient, please notify the sender and delete this email immediately.</em>
        </td>
      </tr>
    </table>
  </div>
  `,
    attachments: [
      {
        filename: `OfferLetter-${employee.firstName} ${employee.lastName}.pdf`,
        content: pdfBuffer,
      },
      {
        filename: "company-logo.png", // ✅ embed logo
        path: path.join("assets", "company-logo.png"),
        cid: "companyLogo", // must match <img src="cid:companyLogo">
      },
    ],
  });
};
