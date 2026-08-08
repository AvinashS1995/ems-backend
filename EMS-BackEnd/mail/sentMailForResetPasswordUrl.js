import { Admin } from "../Models/portfolioModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import resend from "./resend.js";

dotenv.config({ path: "./.env" });

// export const resetPassworlUrlMailSentMail = async (
//   req,
//   res,
//   autoTriggered = false
// ) => {
//   try {
//     const { email } = req.body;
//     const admin = await Admin.findOne({ email: email.toLowerCase() });
//     if (!admin)
//       return res.status(400).json({
//         status: "fail",
//         message: "Email not registered",
//       });

//     const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
//       expiresIn: "15m",
//     });
//     const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

//     // 📧 send reset email
//     await sendEmail({
//       to: email,
//       subject: "Password Reset Link",
//       html: `<p>Click the link below to reset your password:</p>
//              <a href="${resetLink}" target="_blank">${resetLink}</a>`,
//     });

//     if (!autoTriggered) {
//       res.status(201).json({
//         status: "success",
//         message: "Reset password link sent successfully to your email",
//       });
//     }
//   } catch (error) {
//     console.error("❌ Reset Password Email Error:", error);
//     if (!autoTriggered)
//       res.status(500).json({
//         status: "fail",
//         message: "Failed to send reset link",
//       });
//   }
// };

export const resetPassworlUrlMailSentMail = async (
  req,
  res,
  autoTriggered = false,
) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({
      email: email.toLowerCase(),
    });

    if (!admin) {
      return res.status(400).json({
        status: "fail",
        message: "Email not registered",
      });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Reset password URL
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `Portfolio <${process.env.RESEND_EMAIL_FROM}>`,
      to: [email],
      subject: "🔐 Password Reset Link",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>

          <body
            style="
              margin:0;
              padding:0;
              background:#f4f6f8;
              font-family:Arial, Helvetica, sans-serif;
            "
          >

            <div
              style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                border-radius:10px;
                border:1px solid #e5e7eb;
                overflow:hidden;
              "
            >

              <!-- Header -->
              <div
                style="
                  background:#0a2e65;
                  color:#ffffff;
                  padding:24px;
                  text-align:center;
                "
              >
                <h2 style="margin:0;">
                  🔐 Password Reset Request
                </h2>
              </div>

              <!-- Content -->
              <div style="padding:30px;">

                <p
                  style="
                    font-size:16px;
                    color:#333333;
                    line-height:1.6;
                  "
                >
                  Hello,
                </p>

                <p
                  style="
                    font-size:15px;
                    color:#555555;
                    line-height:1.7;
                  "
                >
                  We received a request to reset your password.
                  Click the button below to create a new password.
                </p>

                <!-- Reset Button -->
                <div
                  style="
                    text-align:center;
                    margin:30px 0;
                  "
                >
                  <a
                    href="${resetLink}"
                    target="_blank"
                    style="
                      display:inline-block;
                      padding:13px 25px;
                      background:#0a2e65;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:6px;
                      font-size:15px;
                      font-weight:600;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <p
                  style="
                    font-size:13px;
                    color:#777777;
                    line-height:1.6;
                  "
                >
                  This password reset link will expire in
                  <strong>15 minutes</strong>.
                </p>

                <p
                  style="
                    font-size:13px;
                    color:#777777;
                    line-height:1.6;
                  "
                >
                  If you did not request a password reset, you can safely
                  ignore this email.
                </p>

                <!-- Fallback Link -->
                <p
                  style="
                    font-size:12px;
                    color:#999999;
                    word-break:break-all;
                    margin-top:25px;
                  "
                >
                  If the button doesn't work, copy and paste this link
                  into your browser:
                </p>

                <p
                  style="
                    font-size:12px;
                    color:#0a2e65;
                    word-break:break-all;
                  "
                >
                  ${resetLink}
                </p>

              </div>

              <!-- Footer -->
              <div
                style="
                  background:#f8f9fa;
                  padding:18px;
                  text-align:center;
                  border-top:1px solid #eeeeee;
                "
              >
                <p
                  style="
                    margin:0;
                    font-size:12px;
                    color:#888888;
                  "
                >
                  This is an automated email. Please do not reply.
                </p>

                <p
                  style="
                    margin:8px 0 0;
                    font-size:12px;
                    color:#888888;
                  "
                >
                  © ${new Date().getFullYear()} Portfolio
                </p>
              </div>

            </div>

          </body>
        </html>
      `,
    });

    // Resend error
    if (error) {
      console.error("❌ Resend Password Reset Error:", error);

      if (!autoTriggered) {
        return res.status(500).json({
          status: "fail",
          message: "Failed to send reset link",
        });
      }

      return;
    }

    console.log("✅ Password reset email sent:", data);

    if (!autoTriggered) {
      return res.status(201).json({
        status: "success",
        message: "Reset password link sent successfully to your email",
      });
    }
  } catch (error) {
    console.error("❌ Reset Password Email Error:", error);

    if (!autoTriggered) {
      return res.status(500).json({
        status: "fail",
        message: "Failed to send reset link",
      });
    }
  }
};
