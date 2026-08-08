import transporter from "../mail/transporter.js";
import dotenv from "dotenv";
import resend from "./resend.js";

dotenv.config({ path: "./.env" });

// const sendLeaveEmail = async ({ to, name, status }) => {
//   const subject =
//     status === "Approved" ? "🎉 Your Leave Has Been Approved!" : "❌ Your Leave Has Been Rejected";

//   const message =
//     status === "Approved"
//       ? `<p style="font-size:16px;">We're happy to inform you that your leave request has been <strong style="color:green;">Approved</strong>.</p>`
//       : `<p style="font-size:16px;">We're sorry to inform you that your leave request has been <strong style="color:red;">Rejected</strong>.</p>`;

//   const html = `
//     <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif;
//                 border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
//         <h2 style="text-align:center; color:${status === "Approved" ? "#28a745" : "#dc3545"};">
//           ${status === "Approved" ? "✅ Leave Approved" : "⛔ Leave Rejected"}
//         </h2>
//         <hr style="border: 1px solid #ddd;">
//         <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
//         ${message}
//         <p style="font-size:14px;">Please log in to the employee portal for full details.</p>
//         <p style="font-size:14px;">Thank you,<br>EMS Team</p>
//         <hr style="margin-top:20px; border-top:1px dashed #ccc;">
//         <p style="font-size:12px; text-align:center; color:#888;">© <a href="https://employeemanagementsystem.com"
//                 style="color:#4285F4; text-decoration:none;">employeemanagementsystem.com</a>. All rights reserved.</p>
//     </div>
//   `;

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     html,
//   });
// };

const sendLeaveEmail = async ({ to, name, status }) => {
  try {
    const isApproved = status === "Approved";

    const subject = isApproved
      ? "🎉 Your Leave Has Been Approved!"
      : "❌ Your Leave Has Been Rejected";

    const message = isApproved
      ? `
        <p style="font-size:16px;">
          We're happy to inform you that your leave request has been
          <strong style="color:#28a745;">Approved</strong>.
        </p>
      `
      : `
        <p style="font-size:16px;">
          We're sorry to inform you that your leave request has been
          <strong style="color:#dc3545;">Rejected</strong>.
        </p>
      `;

    const statusColor = isApproved ? "#28a745" : "#dc3545";

    const statusTitle = isApproved ? "✅ Leave Approved" : "⛔ Leave Rejected";

    const html = `
      <div
        style="
          max-width:600px;
          margin:auto;
          padding:20px;
          font-family:Arial,sans-serif;
          border:1px solid #ddd;
          border-radius:10px;
          box-shadow:0 4px 12px rgba(0,0,0,0.1);
          background-color:#ffffff;
        "
      >

        <h2
          style="
            text-align:center;
            color:${statusColor};
          "
        >
          ${statusTitle}
        </h2>

        <hr style="border:1px solid #ddd;">

        <p style="font-size:16px;">
          Hi <strong>${name}</strong>,
        </p>

        ${message}

        <p style="font-size:14px;color:#555;">
          Please log in to the employee portal for full details.
        </p>

        <div style="text-align:center;margin:25px 0;">
          <a
            href="https://employeemanagementsystem.com"
            style="
              display:inline-block;
              padding:12px 24px;
              background-color:${statusColor};
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
              font-size:14px;
              font-weight:600;
            "
          >
            View Employee Portal
          </a>
        </div>

        <p style="font-size:14px;">
          Thank you,<br>
          <strong>EMS Team</strong>
        </p>

        <hr
          style="
            margin-top:20px;
            border:0;
            border-top:1px dashed #ccc;
          "
        >

        <p
          style="
            font-size:12px;
            text-align:center;
            color:#888;
          "
        >
          © ${new Date().getFullYear()}
          <a
            href="https://employeemanagementsystem.com"
            style="
              color:#4285F4;
              text-decoration:none;
            "
          >
            Employee Management System
          </a>.
          All rights reserved.
        </p>

      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `EMS Team <${process.env.RESEND_EMAIL_FROM}>`,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend Leave Email Error:", error);
      throw new Error(error.message);
    }

    console.log(`Leave email sent successfully to ${to}`);

    return data;
  } catch (error) {
    console.error("sendLeaveEmail Error:", error);
    throw error;
  }
};

export { sendLeaveEmail };
