import transporter from "./transporter.js";

const sendEmailToAdmin = async (subject, bucketCount, limit) => {
  const remaining = limit - bucketCount;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.08);">
        <div style="background-color: #007bff; color: white; padding: 16px 24px; border-top-left-radius: 8px; border-top-right-radius: 8px;">
          <h2 style="margin: 0;">📦 Filebase Storage Alert</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #333;">
            Hello Admin,
          </p>
          <p style="font-size: 16px; color: #333;">
            Your <strong>Filebase bucket</strong> has reached <strong>${bucketCount} / ${limit}</strong> files.
          </p>
          <p style="font-size: 16px; color: #d9534f;">
            ⚠️ Only <strong>${remaining} file uploads</strong> are left before hitting the storage cap.
          </p>
          <p style="font-size: 15px; color: #555;">
            Please review, archive, or delete old files to avoid upload failures.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://console.filebase.com" style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">
              🔍 View Filebase Bucket
            </a>
          </div>
          <p style="font-size: 13px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px;">
            This is an automated message from your EMS system. Do not reply.
          </p>
        </div>
      </div>
    </div>
  `;


  await transporter.sendMail({
    from: `\"EMS File Monitor\" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject,
    html: htmlContent
  });
};

export default sendEmailToAdmin