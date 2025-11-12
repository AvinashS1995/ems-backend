import { Admin } from "../Models/portfolioModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const resetPassworlUrlMailSentMail = async (
  req,
  res,
  autoTriggered = false
) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin)
      return res.status(400).json({
        status: "fail",
        message: "Email not registered",
      });

    const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // 📧 send reset email
    await sendEmail({
      to: email,
      subject: "Password Reset Link",
      html: `<p>Click the link below to reset your password:</p>
             <a href="${resetLink}" target="_blank">${resetLink}</a>`,
    });

    if (!autoTriggered) {
      res.status(201).json({
        status: "success",
        message: "Reset password link sent successfully to your email",
      });
    }
  } catch (error) {
    console.error("❌ Reset Password Email Error:", error);
    if (!autoTriggered)
      res.status(500).json({
        status: "fail",
        message: "Failed to send reset link",
      });
  }
};
