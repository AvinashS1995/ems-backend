import { PASSWORD_PATTERN_REGEX } from "../common/constant.js";
import { resetPassworlUrlMailSentMail } from "../mail/sentMailForResetPasswordUrl.js";
import { Admin } from "../Models/portfolioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;
    console.log(req.body);
    // Validate fields
    if (!fullName || !email || !password || !confirmPassword)
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });

    if (password !== confirmPassword)
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });

    if (!PASSWORD_PATTERN_REGEX.test(password))
      return res.status(400).json({
        status: "fail",
        message:
          "Password must include uppercase, lowercase, number, and special character",
      });

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({
        status: "fail",
        message: "Admin already exists",
      });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin with optional role
    const newAdmin = new Admin({
      fullName,
      email,
      password: hashedPassword,
      role: role || "admin",
    });

    await newAdmin.save();

    res.status(201).json({
      status: "success",
      message: "Admin account created successfully!",
      data: {
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        status: "fail",
        message: "Email and password are required",
      });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin)
      return res.status(400).json({
        status: "fail",
        message: "Invalid email or password",
      });

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(403).json({
        status: "fail",
        message:
          "Account locked due to multiple failed attempts. Check your email to reset password.",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Increment failed attempts
      admin.failedLoginAttempts += 1;

      if (admin.failedLoginAttempts >= 3) {
        admin.isLocked = true;
        await admin.save();

        // 🔐 Trigger password reset email
        await resetPassworlUrlMailSentMail(req, res, true); // pass flag to avoid double response

        return res.status(403).json({
          status: "fail",
          message:
            "Too many failed attempts. Password reset link sent to your email.",
        });
      }

      await admin.save();

      return res.status(400).json({
        status: "fail",
        message: `Invalid password. ${
          3 - admin.failedLoginAttempts
        } attempts remaining.`,
      });
    }

    // ✅ Successful login — reset attempts
    admin.failedLoginAttempts = 0;
    admin.isLocked = false;
    await admin.save();

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      status: "fail",
      message: "Login successful",
      token,
      data: {
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const LogOut = async (req, res) => {
  try {
    // If using JWT → frontend just deletes token, you can still send a success response
    // If using sessions, you can destroy the session like:
    if (req.session) {
      req.session.destroy();
    }

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ Error during logout:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword)
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });

    if (newPassword !== confirmPassword)
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });

    if (!PASSWORD_PATTERN_REGEX.test(newPassword))
      return res.status(400).json({
        status: "fail",
        message:
          "Password must contain uppercase, lowercase, number, and special character",
      });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const GetAdminUserList = async (req, res) => {
  try {
    const { name, role } = req.body;
    const filter = {};

    if (name) filter.fullName = { $regex: name, $options: "i" };
    if (role) filter.role = role;

    const admins = await Admin.find(filter)
      .select("fullName email role createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Admin user list fetched successfully",
      total: admins.length,
      data: {
        admins,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};
