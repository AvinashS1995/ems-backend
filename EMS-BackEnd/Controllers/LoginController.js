import { User } from "./../Models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "../Models/otpModel.js";
import transporter from "../mail/transporter.js";
import dotenv from "dotenv";
import { generateRandomKey, encrypt } from "../common/common.js";
import { getPresignedUrl } from "../storage/s3.config.js";

dotenv.config({ path: "./.env" });

// Login API Method
const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const secretKey = generateRandomKey();
    const encryptedSecretKey = encrypt(secretKey);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User Not Found..!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(404).json({
        status: "fail",
        message: "Wrong Password..!",
      });
    }

    // const token = jwt.sign(
    //   { _id: user._id, role: user.role },
    //   process.env.JWT_SECRET_KEY,
    //   { expiresIn: "10d" }
    // );

    const fileKey = user.profileImage || "";
    if (fileKey) {
      const presignedUrl = await getPresignedUrl(fileKey, 3600);
      user.profileImage = presignedUrl;
    }

    const token = jwt.sign(
      {
        _id: user._id,
        empNo: user.empNo,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        dob: user.dob,
        gender: user.gender,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        country: user.country,
        role: user.role,
        type: user.type,
        status: user.status,
        reportedBy: user.reportedBy,
        designation: user.designation,
        department: user.department,
        joiningDate: user.joiningDate,
        salary: user.salary,
        workType: user.workType,
        designation: user.designation,
        profileImage: user.profileImage,
        loginUserSecretKey: secretKey,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "10d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login Successfully..!",
      token,
      secretKey: encryptedSecretKey,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        empNo: user.empNo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Verify Email API Method
const VerifyEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // console.log("Email--", user)

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Email Not Found..!",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Valid Email Fetched Successfully!",
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Send OTP API Method
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Set OTP expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({ email, otp: hashedOtp, expiresAt });

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔐 Reset Password - OTP Authentication",
      html: `
<div style="max-width: 600px; margin: auto; padding: 20px; font-family: 'Segoe UI', sans-serif; 
            background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 10px;">
  <h2 style="text-align:center; color:#4285F4;">Reset Your Password</h2>
  <p style="text-align:center; font-size:16px;">Use the OTP below to reset your EMS account password.</p>
  <div style="text-align:center; margin: 20px 0;">
    <span style="font-size:36px; color:#28a745; font-weight:bold;">${otpCode}</span>
  </div>
  <p style="text-align:center; font-size:14px; color:#555;">This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
  <hr style="margin: 20px 0;">
  <p style="text-align:center; font-size:12px; color:#888;">Need help? Contact <a href="mailto:support@employeemanagementsystem.com" style="color:#4285F4;">support@employeemanagementsystem.com</a></p>
</div>
`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return res.status(500).json({
          status: "fail",
          message: err.message,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "OTP Successfully send on your Registered Email.",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Resend OTP API Method
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const salt = await bcrypt.genSalt(10);

    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Update OTP in DB
    await OTP.findOneAndUpdate(
      { email },
      { otp: hashedOtp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      { upsert: true }
    );

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📩 Resent OTP - Reset Your Password",
      html: `
<div style="max-width: 600px; margin: auto; padding: 20px; font-family: 'Segoe UI', sans-serif; 
            background-color: #fff8f0; border: 1px solid #ffd7b5; border-radius: 10px;">
  <h2 style="text-align:center; color:#FF9800;">Here's Your New OTP</h2>
  <p style="text-align:center; font-size:16px;">You requested a new OTP to reset your EMS password.</p>
  <div style="text-align:center; margin: 20px 0;">
    <span style="font-size:36px; color:#ff5722; font-weight:bold;">${otpCode}</span>
  </div>
  <p style="text-align:center; font-size:14px; color:#555;">This OTP will expire in <strong>5 minutes</strong>.</p>
  <hr style="margin: 20px 0;">
  <p style="text-align:center; font-size:12px; color:#888;">If you didn't request this, please ignore the email.</p>
</div>
`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          status: "fail",
          message: err.message,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "OTP Successfully Resend on your Registered Email.",
      });
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Verify OTP API Method
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find latest OTP record
    const record = await OTP.findOne({ email }).sort({ expiresAt: -1 });

    if (!record) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP",
      });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, record.otp);

    if (!isMatch) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP",
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        status: "fail",
        message: "OTP Expired",
      });
    }

    res.status(200).json({
      status: "success",
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

//  Reset Password API Password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      status: "sucess",
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const LogOut = async (req, res) => {
  try {
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export {
  Login,
  VerifyEmail,
  sendOtp,
  resendOtp,
  verifyOtp,
  resetPassword,
  LogOut,
};
