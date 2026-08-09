import resend from "./resend.js";
import transporter from "./transporter.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// const sendEmail = async ({ to, subject, html }) => {
//   await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
// };

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.RESEND_EMAIL_FROM) {
      throw new Error("RESEND_EMAIL_FROM is not configured");
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM,
      to: [to],
      subject,
      html,
    });

    console.log([process.env.RESEND_EMAIL_FROM]);
    console.log([to]);

    if (error) {
      console.error("[Resend API Error]:", error);

      throw new Error(`Resend Error: ${error.message}`);
    }

    console.log(`Email sent successfully to ${to}`);

    return data;
  } catch (error) {
    console.error("sendEmail Error:", error.message);
    throw error;
  }
};

export default sendEmail;
