import transporter from "./transporter.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// const sendEmail = async ({ to, subject, html }) => {
//   await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
// };

const sendEmail = async ({ to, subject, html }) => {
  // Resend मध्ये 'from' अनिवार्य आहे
  // जोपर्यंत तुमचे डोमेन व्हेरीफाय होत नाही, तोपर्यंत .env मध्ये EMAIL_FROM = onboarding@resend.dev ठेवा
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend Error: ${error.message}`);
  }

  return data;
};

export default sendEmail;
