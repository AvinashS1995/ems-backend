import transporter from "./transporter.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

export default sendEmail;
