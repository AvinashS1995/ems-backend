import { PASSWORD_PATTERN_REGEX } from "../common/constant.js";
import { resetPassworlUrlMailSentMail } from "../mail/sentMailForResetPasswordUrl.js";
import {
  Admin,
  DashboardCards,
  DashboardStats,
} from "../Models/portfolioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateTokens } from "../common/generateTokens.js";

dotenv.config({ path: "./.env" });

const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutes access token
const blacklistedTokens = new Set(); // can be replaced by Redis in production
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
// export const createAdmin = async (req, res) => {
//   try {
//     const { fullName, email, password, confirmPassword, role } = req.body;
//     console.log(req.body);
//     // Validate fields
//     if (!fullName || !email || !password || !confirmPassword)
//       return res.status(400).json({
//         status: "fail",
//         message: "All fields are required",
//       });

//     if (password !== confirmPassword)
//       return res.status(400).json({
//         status: "fail",
//         message: "Passwords do not match",
//       });

//     if (!PASSWORD_PATTERN_REGEX.test(password))
//       return res.status(400).json({
//         status: "fail",
//         message:
//           "Password must include uppercase, lowercase, number, and special character",
//       });

//     // Check if admin already exists
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin)
//       return res.status(400).json({
//         status: "fail",
//         message: "Admin already exists",
//       });

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create admin with optional role
//     const newAdmin = new Admin({
//       fullName,
//       email,
//       password: hashedPassword,
//       role: role || "admin",
//     });

//     await newAdmin.save();

//     res.status(201).json({
//       status: "success",
//       message: "Admin account created successfully!",
//       data: {
//         fullName: newAdmin.fullName,
//         email: newAdmin.email,
//         role: newAdmin.role,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error creating admin:", error);
//     res.status(500).json({
//       status: "fail",
//       message: error.message,
//     });
//   }
// };

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const admin = await Admin.create({ fullName, email, password, role });
    return res.status(201).json({ message: "Admin created", admin });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { password } = req.body;
    const ip = req.ip;

    if (!password) {
      return res.status(400).json({
        status: "fail",
        message: "Password is required",
      });
    }

    const admins = await Admin.find({ status: "active" }).select("+password");

    for (const admin of admins) {
      const isMatch = await bcrypt.compare(password, admin.password);

      if (isMatch) {
        // 🔐 Lock Check
        if (admin.lockUntil && admin.lockUntil > Date.now()) {
          const remaining = Math.ceil((admin.lockUntil - Date.now()) / 60000);
          return res.status(403).json({
            status: "fail",
            message: `Account locked. Try again after ${remaining} minute(s).`,
          });
        }

        admin.isLoggedIn = true;
        admin.failedLoginAttempts = 0;
        admin.lockUntil = undefined;

        let newIpDetected = false;
        if (admin.lastLoginIp && admin.lastLoginIp !== ip) {
          if (!admin.suspiciousIps.includes(ip)) {
            admin.suspiciousIps.push(ip);
            newIpDetected = true;
          }
        }

        admin.lastLoginIp = ip;
        await admin.save();

        if (newIpDetected) {
          await transporter.sendMail({
            from: `"Security Alert" <${process.env.ADMIN_EMAIL}>`,
            to: admin.email,
            subject: "⚠️ New IP Login Detected",
            html: `
              <h3>Hello ${admin.fullName},</h3>
              <p>New login detected from IP: <strong>${ip}</strong></p>
              <p>If this was you, ignore. Otherwise, reset your password immediately.</p>
            `,
          });
        }

        // ✅ Generate Tokens via helper
        const { accessToken, refreshToken } = generateTokens(admin);

        return res.status(200).json({
          status: "success",
          message: "Login successful",
          tokens: { accessToken, refreshToken },
          admin: {
            id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
            lastLoginIp: admin.lastLoginIp,
          },
        });
      } else {
        admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;

        if (admin.failedLoginAttempts >= 3) {
          admin.lockUntil = Date.now() + 15 * 60 * 1000;
          admin.status = "locked";
          await admin.save();

          return res.status(403).json({
            status: "fail",
            message: `Account locked due to too many failed attempts. Try again after 15 minutes.`,
          });
        }

        const remaining = 3 - admin.failedLoginAttempts;
        await admin.save();

        return res.status(401).json({
          status: "fail",
          message: `Incorrect password. You have ${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining.`,
        });
      }
    }
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: "fail",
        message: "Refresh token is required",
      });
    }

    // Verify token validity
    jwt.verify(refreshToken, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          status: "fail",
          message: "Invalid or expired refresh token. Please login again.",
        });
      }

      // Find admin by ID
      const admin = await Admin.findById(decoded.id);
      if (!admin || admin.status !== "active") {
        return res.status(404).json({
          status: "fail",
          message: "Admin not found or inactive",
        });
      }

      // Generate a new short-lived access token
      const newAccessToken = jwt.sign(
        { id: admin._id, role: admin.role },
        JWT_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      return res.status(200).json({
        status: "success",
        message: "Access token refreshed successfully",
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      status: "fail",
      message: "Server error",
      error: error.message,
    });
  }
};

export const LogOut = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: "fail", message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    if (!decoded?.id) {
      return res.status(400).json({ status: "fail", message: "Invalid token" });
    }

    // Blacklist the access token to prevent reuse
    blacklistedTokens.add(token);

    await Admin.findByIdAndUpdate(decoded.id, {
      isLoggedIn: false,
      lastLogoutAt: new Date(),
    });

    return res.status(200).json({
      status: "success",
      message: "Logout successful. Token invalidated.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ status: "fail", message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Email and new password required",
      });
    }

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });

    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server error",
    });
  }
};

export const GetAdminUserList = async (req, res) => {
  try {
    const { role } = req.body;

    if (role !== "Super Admin") {
      return res.status(403).json({
        status: "fail",
        message: "Access denied. Only Super Admin allowed.",
      });
    }

    const admins = await Admin.find().select(
      "fullName email role status lastLoginIp isLoggedIn"
    );
    return res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        admins,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.body;
    const { fullName, email, role, status } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.fullName = fullName || admin.fullName;
    admin.email = email || admin.email;
    admin.role = role || admin.role;
    admin.status = status || admin.status;

    await admin.save();

    res.status(200).json({ message: "Admin updated successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    return res.status(200).json({ message: "Admin deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const toggleLockAdmin = async (req, res) => {
  try {
    const { id } = req.body;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.status = admin.status === "active" ? "locked" : "active";
    if (admin.status === "active") {
      admin.failedLoginAttempts = 0;
      admin.lockUntil = undefined;
    }
    await admin.save();

    return res.status(200).json({ message: `Admin ${admin.status}` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAdminActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    return res
      .status(200)
      .json({ userName: admin.fullName, activities: admin.activities || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const saveDashboardCard = async (req, res) => {
  try {
    const { icon, title, desc, link } = req.body;
    if (!title || !link)
      return res.status(400).json({
        success: "success",
        message: "Title and link are required",
      });

    const newCard = new DashboardCards({
      icon,
      title,
      desc,
      link,
      createdBy: req.user?.id || "system",
    });

    await newCard.save();
    res.status(201).json({
      success: "success",
      message: "Card saved successfully",
      data: { newCard },
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: error.error.message,
    });
  }
};

export const getDashboardCards = async (req, res) => {
  try {
    const cards = await DashboardCards.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: "success",
      message: "Record(s) Fetched Successfully!",
      data: { cards },
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: error.error.message,
    });
  }
};

export const saveDashboardStat = async (req, res) => {
  try {
    const { label, count, icon, link, color } = req.body;
    if (!label || count == null)
      return res.status(400).json({
        success: "success",
        message: "Label and count are required",
      });

    const newStat = new DashboardStats({
      label,
      count,
      icon,
      link,
      color,
      createdBy: req.user?.id || "system",
    });

    await newStat.save();
    res.status(201).json({
      success: "success",
      message: "Stat saved successfully",
      data: { newStat },
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: error.error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await DashboardStats.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: "success",
      message: "Record(s) Fetchded Successfully!",
      data: { stats },
    });
  } catch (error) {
    res.status(500).json({
      success: "fail",
      message: error.error.message,
    });
  }
};
