import dotenv from "dotenv";
import transporter from "./transporter.js";

dotenv.config({ path: "./.env" });

const sendUserMessageTemplate = async ({ name, email, subject, message }) => {
  const html = `
  <div style="font-family: Arial, sans-serif; font-size:15px; color:#111; line-height:1.6;">
    
    <p>Hello ${process.env.PORTFOLIO_OWNER_NAME || "Sir"},</p>

    <p>${message}</p>

    <p>
      Regards,<br>
      <strong>${name}</strong>
    </p>

    <hr style="margin-top:25px; border:none; border-top:1px solid #ddd;" />

    <p style="font-size:12px; color:#777;">
      This message was sent from your portfolio website.
    </p>

  </div>
  `;

  await transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: subject,
    html,
  });
};

export { sendUserMessageTemplate };
