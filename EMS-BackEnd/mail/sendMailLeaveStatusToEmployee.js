import transporter from "../mail/transporter.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const sendLeaveEmail = async ({ to, name, status }) => {
  const subject =
    status === "Approved" ? "🎉 Your Leave Has Been Approved!" : "❌ Your Leave Has Been Rejected";

  const message =
    status === "Approved"
      ? `<p style="font-size:16px;">We're happy to inform you that your leave request has been <strong style="color:green;">Approved</strong>.</p>`
      : `<p style="font-size:16px;">We're sorry to inform you that your leave request has been <strong style="color:red;">Rejected</strong>.</p>`;

  const html = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; 
                border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="text-align:center; color:${status === "Approved" ? "#28a745" : "#dc3545"};">
          ${status === "Approved" ? "✅ Leave Approved" : "⛔ Leave Rejected"}
        </h2>
        <hr style="border: 1px solid #ddd;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        ${message}
        <p style="font-size:14px;">Please log in to the employee portal for full details.</p>
        <p style="font-size:14px;">Thank you,<br>EMS Team</p>
        <hr style="margin-top:20px; border-top:1px dashed #ccc;">
        <p style="font-size:12px; text-align:center; color:#888;">© <a href="https://employeemanagementsystem.com" 
                style="color:#4285F4; text-decoration:none;">employeemanagementsystem.com</a>. All rights reserved.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export { sendLeaveEmail }