import {
  About,
  Admin,
  DashboardCards,
  DashboardStats,
  Services,
} from "../Models/portfolioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateTokens } from "../common/generateTokens.js";
import mongoose from "mongoose";
import { ideahub_v1alpha } from "googleapis";

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
    const { fullName, email, role, password } = req.body;

    // Validate Required Fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "fields are required",
      });
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create Admin → username auto-generates from model hook
    const admin = await Admin.create({
      fullName,
      email,
      password,
      role: role,
    });

    return res.status(201).json({
      status: "success",
      message: `${role} created successfully`,
      data: { admin },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      error: error.message,
    });
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
    const { id } = req.body;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    return res
      .status(200)
      .json({ userName: admin.fullName, activities: admin.activities || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const saveDashboardCards = async (req, res) => {
  try {
    const { role, cards } = req.body;

    if (!role || !cards) {
      return res.status(400).json({ message: "Role and cards are required." });
    }

    const existing = await DashboardCards.findOne({ role });
    if (existing) {
      existing.cards = cards;
      await existing.save();
      return res.status(200).json({
        status: "success",
        message: "Cards updated successfully",
        data: { existing },
      });
    }

    const newCards = await DashboardCards.create({ role, cards });
    res.status(201).json({
      status: "success",
      message: "Cards saved successfully",
      data: { newCards },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.error.message,
    });
  }
};

export const getDashboardCards = async (req, res) => {
  try {
    const { role } = req.body; // coming from frontend
    if (!role)
      return res.status(400).json({
        status: "fail",
        message: "Role is required.",
      });

    const data = await DashboardCards.findOne({ role });
    if (!data)
      return res.status(404).json({
        status: "fail",
        message: "No cards found for this role.",
      });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: { cards: data.cards },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const saveDashboardStats = async (req, res) => {
  try {
    const { role, stats } = req.body;

    if (!role || !stats) {
      return res.status(400).json({
        status: "fail",
        message: "Role and stats are required.",
      });
    }

    const existing = await DashboardStats.findOne({ role });

    if (existing) {
      existing.stats = stats;
      await existing.save();
      return res.status(200).json({
        status: "success",
        message: "Stats updated successfully",
        data: { existing },
      });
    }

    const newStats = await DashboardStats.create({ role, stats });
    res.status(201).json({
      status: "success",
      message: "Stats saved successfully",
      data: { newStats },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role)
      return res.status(400).json({
        status: "fail",
        message: "Role is required.",
      });

    const data = await DashboardStats.findOne({ role });
    if (!data)
      return res.status(404).json({
        status: "fail",
        message: "No stats found for this role.",
      });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: { stats: data.stats },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Portfolio About API
export const SavePortfolioAbout = async (req, res) => {
  try {
    const adminId = req.body.id;

    const { name, title, bio, bio2, profileImage, resumeUrl, stats } = req.body;

    // Required fields
    if (!name || !title || !bio) {
      return res.status(400).json({
        status: "fail",
        message: "Name, Title and Bio are required",
      });
    }

    // Find admin
    const admin = await Admin.findById(adminId);
    // if (!admin) {
    //   return res.status(404).json({
    //     status: "fail",
    //     message: "Admin not found",
    //   });
    // }

    // Detect create vs update
    const isNew = !admin.about || !admin.about.name;

    // Initialize about field if empty
    if (!admin.about) admin.about = {};

    // Assign values
    admin.about.name = name;
    admin.about.title = title;
    admin.about.bio = bio;
    admin.about.bio2 = bio2 || "";
    admin.about.profileImage = profileImage || "";
    admin.about.resumeUrl = resumeUrl || "";

    // Stats
    admin.about.stats = {
      experience: stats?.experience || 0,
      clients: stats?.clients || 0,
      recruiters: stats?.recruiters || 0,
    };

    admin.about.updatedAt = new Date();

    await admin.save();

    return res.status(isNew ? 201 : 200).json({
      status: "success",
      action: isNew ? "Created" : "Updated",
      message: isNew
        ? "About section created successfully"
        : "About section updated successfully",
      data: admin.about,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const GetPortfolioAbout = async (req, res) => {
  try {
    const adminId = req.body.id;

    const admin = await Admin.findById(adminId);

    res.status(200).json({
      status: "success",
      message: "About data fetched successfully",
      data: { about: admin.about },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Educations API
export const AddEducation = async (req, res) => {
  try {
    const { adminId, degree, university, period } = req.body;

    if (!adminId || !degree || !university || !period) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const newEducation = {
      id: new mongoose.Types.ObjectId(),
      degree,
      university,
      period,
    };

    admin.education.push(newEducation);
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Education added successfully",
      data: { newEducation: admin.education },
    });
  } catch (err) {
    console.error("Add Education Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioEducations = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    const sortedEducations = (admin.education || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      status: "success",
      message: "Educations data fetched successfully",
      data: { educations: sortedEducations || [] },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdateEducation = async (req, res) => {
  try {
    const { adminId, eduId, degree, university, period } = req.body;

    if (!adminId || !eduId || !degree || !university || !period) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const eduIndex = admin.education.findIndex(
      (e) => e._id.toString() === eduId
    );
    if (eduIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Education not found" });
    }

    // Update fields
    admin.education[eduIndex] = {
      ...admin.education[eduIndex],
      degree,
      university,
      period,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Education updated successfully",
      data: admin.education[eduIndex],
    });
  } catch (err) {
    console.error("Update Education Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeleteEducation = async (req, res) => {
  try {
    const { adminId, eduId } = req.body;

    if (!adminId || !eduId) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID and Education ID are required",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const eduIndex = admin.education.findIndex(
      (e) => e._id.toString() === eduId
    );
    if (eduIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Education not found" });
    }

    const removedEdu = admin.education.splice(eduIndex, 1); // remove from array
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Education deleted successfully",
      data: removedEdu[0],
    });
  } catch (err) {
    console.error("Delete Education Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Experiences API
export const AddPortfolioExperiences = async (req, res) => {
  try {
    const { adminId, company, role, period, project, description } = req.body;

    if (!adminId || !company || !role || !period || !project || !description) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const newExperience = {
      id: new mongoose.Types.ObjectId(),
      company,
      role,
      period,
      project,
      description,
      createdAt: new Date(),
    };

    admin.experience.push(newExperience);
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Experience added successfully",
      data: { newExperience: admin.experience },
    });
  } catch (err) {
    console.error("Add Experience Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioExperiences = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    const sortedExperiences = (admin.experience || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      status: "success",
      message: "Experiences data fetched successfully",
      data: { experience: sortedExperiences || [] },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdatePortfolioExperiences = async (req, res) => {
  try {
    const { adminId, expId, company, role, period, project, description } =
      req.body;

    if (
      !adminId ||
      !expId ||
      !company ||
      !role ||
      !period ||
      !project ||
      !description
    ) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const expIndex = admin.experience.findIndex(
      (e) => e._id.toString() === expId
    );
    if (expIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Experience not found" });
    }

    // Update fields
    admin.experience[expIndex] = {
      ...admin.experience[expIndex],
      company,
      role,
      period,
      project,
      description,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Experience updated successfully",
      data: admin.experience[expIndex],
    });
  } catch (err) {
    console.error("Update Experience Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeletePortfolioExperiences = async (req, res) => {
  try {
    const { adminId, expId } = req.body;

    if (!adminId || !expId) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID and Experience ID are required",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const expIndex = admin.experience.findIndex(
      (e) => e._id.toString() === expId
    );
    if (expIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Experience not found" });
    }

    const removedExp = admin.experience.splice(expIndex, 1); // remove from array
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Experience deleted successfully",
      data: removedExp[0],
    });
  } catch (err) {
    console.error("Delete Experience Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Services API
export const AddPortfolioServices = async (req, res) => {
  try {
    const { adminId, title, icon, color, description } = req.body;

    if (!adminId || !title || !icon || !color || !description) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const newServices = {
      id: new mongoose.Types.ObjectId(),
      title,
      icon,
      color,
      description,
      createdAt: new Date(),
    };

    admin.services.push(newServices);
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Services added successfully",
      data: { newServices: admin.services },
    });
  } catch (err) {
    console.error("Add Services Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioServices = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    const sortedServices = admin.services || [];

    res.status(200).json({
      status: "success",
      message: "Services data fetched successfully",
      data: { services: sortedServices || [] },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdatePortfolioServices = async (req, res) => {
  try {
    const { adminId, serviceId, title, icon, color, description } = req.body;

    if (!adminId || !serviceId || !title || !icon || !color || !description) {
      return res
        .status(400)
        .json({ status: "fail", message: "All fields are required" });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const servicesIndex = admin.services.findIndex(
      (e) => e._id.toString() === serviceId
    );
    if (servicesIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Services not found" });
    }

    // Update fields
    admin.services[servicesIndex] = {
      ...admin.services[servicesIndex],
      title,
      icon,
      color,
      description,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Services updated successfully",
      data: admin.services[servicesIndex],
    });
  } catch (err) {
    console.error("Update Services Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeletePortfolioServices = async (req, res) => {
  try {
    const { adminId, serviceId } = req.body;

    if (!adminId || !serviceId) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID and Services ID are required",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const servicesIndex = admin.services.findIndex(
      (e) => e._id.toString() === serviceId
    );
    if (servicesIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Services not found" });
    }

    const removedServices = admin.services.splice(servicesIndex, 1); // remove from array
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Services deleted successfully",
      data: removedServices[0],
    });
  } catch (err) {
    console.error("Delete Services Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};
