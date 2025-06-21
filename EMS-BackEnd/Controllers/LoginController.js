import { User } from "./../Models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import OTP from "../Models/otpModel.js";
import transporter from "../mail/transporter.js";
import dotenv from "dotenv";
import { generateRandomKey, encrypt } from '../common/common.js';

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
    const token = jwt.sign(
      { _id: user._id, 
        empNo: user.empNo, 
        name: user.name, 
        email: user.email, 
        mobile: user.mobile,
        role: user.role, 
        type: user.type, 
        status: user.status, 
        teamLeader: user.teamLeader, 
        manager: user.manager, 
        hr: user.hr, 
        designation: user.designation, 
        joiningDate: user.joiningDate, 
        salary: user.salary, 
        workType: user.workType, 
        designation: user.designation,
        loginUserSecretKey: secretKey 
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
        empNo: user.empNo
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
      subject: "Reset Password for Email OTP Authetication",
      html: `
    <div style="max-width: 500px; margin: auto; padding: 20px; font-family: Arial, sans-serif; 
                border: 1px solid #ddd; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4285F4; text-align: center;">Email OTP</h2>
        <hr style="border: 1px solid #ddd;">
        <p style="font-size: 16px; text-align: center;">Dear User,</p>
        <p style="font-size: 16px; text-align: center;">Your One-Time Password (OTP) is:</p>
        <h1 style="color: #4CAF50; text-align: center; font-size: 36px;">${otpCode}</h1>
        <p style="font-size: 14px; text-align: center;">Please use this OTP to complete your login Reset Password process. It is valid for 5 minutes.
            Do not share this code with anyone.</p>
        <p style="font-size: 14px; text-align: center;">Thank you for using Email OTP!</p>
        <hr style="border: 1px solid #ddd;">
        <p style="text-align: center; font-size: 12px; color: #888;">© <a href="https://www.yourwebsite.com" 
                style="color: #4285F4; text-decoration: none;">employeemanagementsystem.com</a>. All rights reserved.</p>
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
      subject: "Reset Password for Email Resent OTP Authetication",
      html: `
    <div style="max-width: 500px; margin: auto; padding: 20px; font-family: Arial, sans-serif; 
                border: 1px solid #ddd; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4285F4; text-align: center;">Email OTP</h2>
        <hr style="border: 1px solid #ddd;">
        <p style="font-size: 16px; text-align: center;">Dear User,</p>
        <p style="font-size: 16px; text-align: center;">Your One-Time Password (OTP) is:</p>
        <h1 style="color: #4CAF50; text-align: center; font-size: 36px;">${otpCode}</h1>
        <p style="font-size: 14px; text-align: center;">Please use this OTP to complete your login Reset Password process. It is valid for 5 minutes.
            Do not share this code with anyone.</p>
        <p style="font-size: 14px; text-align: center;">Thank you for using Email OTP!</p>
        <hr style="border: 1px solid #ddd;">
        <p style="text-align: center; font-size: 12px; color: #888;">© <a href="https://www.yourwebsite.com" 
                style="color: #4285F4; text-decoration: none;">employeemanagementsystem.com</a>. All rights reserved.</p>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err)
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
            message: "All fields are required" 
          });
      }

      if (newPassword !== confirmPassword) {
          return res.status(400).json({
            status: "fail", 
            message: "Passwords do not match" 
          });
      }

      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          status: "fail", 
          message: "User not found" 
        });

      }

      // Hash new password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.status(200).json({
        status: "sucess", 
        message: "Password reset successfully" 
      });

  } catch (error) {
      return res.status(500).json({
        status: "fail", 
        message: error.message 
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
}


export { Login, VerifyEmail, sendOtp, resendOtp, verifyOtp, resetPassword, LogOut };
