import dotenv from "dotenv";
import transporter from "./transporter.js";

dotenv.config({ path: "./.env" });

// const sendUserMessageTemplate = async ({ name, email, subject, message }) => {
//   const html = `
//   <div style="font-family: Arial, sans-serif; font-size:15px; color:#111; line-height:1.6;">

//     <p>Hello ${process.env.PORTFOLIO_OWNER_NAME || "Sir"},</p>

//     <p>${message}</p>

//     <p>
//       Regards,<br>
//       <strong>${name}</strong>
//     </p>

//     <hr style="margin-top:25px; border:none; border-top:1px solid #ddd;" />

//     <p style="font-size:12px; color:#777;">
//       This message was sent from your portfolio website.
//     </p>

//   </div>
//   `;

//   await transporter.sendMail({
//     from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
//     to: process.env.EMAIL_USER,
//     replyTo: email,
//     subject: subject,
//     html,
//   });
// };

import resend from "./resend.js";

dotenv.config({ path: "./.env" });

const sendUserMessageTemplate = async ({ name, email, subject, message }) => {
  try {
    const html = `
      <div
        style="
          max-width:600px;
          margin:0 auto;
          padding:25px;
          font-family:Arial, Helvetica, sans-serif;
          background:#ffffff;
          border:1px solid #e5e7eb;
          border-radius:10px;
        "
      >

        <p style="font-size:16px; color:#333;">
          Hello <strong>${process.env.PORTFOLIO_OWNER_NAME || "Sir"}</strong>,
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.7;
            color:#333;
          "
        >
          ${message}
        </p>

        <p
          style="
            font-size:15px;
            line-height:1.6;
            color:#333;
          "
        >
          Regards,<br>
          <strong>${name}</strong>
        </p>

        <hr
          style="
            margin-top:25px;
            border:none;
            border-top:1px solid #ddd;
          "
        />

        <p
          style="
            font-size:12px;
            color:#777;
            text-align:center;
          "
        >
          This message was sent from your portfolio website.
        </p>

      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `Portfolio Contact <${process.env.RESEND_EMAIL_FROM}>`,
      to: [process.env.EMAIL_USER],
      replyTo: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend Portfolio Email Error:", error);
      throw new Error(error.message);
    }

    console.log(
      `Portfolio contact email sent successfully from ${email}`,
      data,
    );

    return data;
  } catch (error) {
    console.error("sendUserMessageTemplate Error:", error);
    throw error;
  }
};

export { sendUserMessageTemplate };
