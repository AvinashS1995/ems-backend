import {
  Admin,
  AiUsage,
  DashboardCards,
  DashboardStats,
} from "../Models/portfolioModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateTokens } from "../common/generateTokens.js";
import mongoose from "mongoose";
import { getPresignedUrl } from "../storage/s3.config.js";
import {
  addActivity,
  addLoginHistory,
  extractClientInfo,
  fetchLocation,
  saveLocation,
} from "../common/loginSecurity.js";
import { generateBioFromGemini } from "../common/aiService.js";

dotenv.config({ path: "./.env" });

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const blacklistedTokens = new Set();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, role, password } = req.body;
    const client = extractClientInfo(req);

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "fields are required" });
    }

    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      // log failed creation
      await addActivity(
        null,
        "Admin Create Failed",
        `Email ${email} already exists`,
        client,
        "failed"
      );

      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const admin = await Admin.create({
      fullName,
      email,
      password,
      role,
    });

    // SUCCESS ACTIVITY
    await addActivity(
      admin,
      "Admin Created",
      `New admin created with role: ${role}`,
      client
    );

    return res.status(201).json({
      status: "success",
      message: `${role} created successfully`,
      data: { admin },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", error: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = extractClientInfo(req);

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password required",
      });
    }

    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      await addActivity(
        null,
        "Login Failed",
        "Invalid email",
        client,
        "failed"
      );
      return res
        .status(401)
        .json({ status: "fail", message: "Invalid email or password" });
    }

    // Check for lock
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(403).json({
        status: "fail",
        message: `Account locked. Try again later`,
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await admin.incrementLoginAttempts();
      await addActivity(
        admin,
        "Login Failed",
        "Incorrect password",
        client,
        "failed"
      );

      return res.status(401).json({
        status: "fail",
        message: "Incorrect password",
      });
    }

    // SUCCESS LOGIN
    await admin.resetLoginAttempts();
    admin.isLoggedIn = true;

    // SESSION ID
    const sessionId = `${admin._id}-${Date.now()}`;

    // SAVE LOGIN HISTORY (without location first)
    await addLoginHistory(admin, client, sessionId);

    // FETCH GEO IP
    const geoLocation = await fetchLocation(client.ip);

    // SAVE LOCATION INSIDE LAST loginHistory
    await saveLocation(admin, geoLocation);

    // SAVE ACTIVITY
    await addActivity(admin, "Login Success", "Logged in successfully", client);

    if (admin.profileImage) {
      admin.profileImage = await getPresignedUrl(admin.profileImage, 3600);
    }

    const { accessToken, refreshToken } = generateTokens(admin);
    await admin.save();

    return res.status(200).json({
      status: "success",
      message: `${admin.role} Login successful`,
      tokens: { accessToken, refreshToken },
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        profileImage: admin.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res
        .status(400)
        .json({ status: "fail", message: "Refresh token required" });

    jwt.verify(refreshToken, JWT_SECRET_KEY, async (err, decoded) => {
      if (err)
        return res.status(403).json({
          status: "fail",
          message: "Invalid or expired refresh token. Please login again.",
        });

      const admin = await Admin.findById(decoded.id);
      if (!admin)
        return res
          .status(404)
          .json({ status: "fail", message: "Admin not found" });

      const newAccessToken = jwt.sign(
        { id: admin._id, role: admin.role },
        JWT_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      return res.status(200).json({
        status: "success",
        accessToken: newAccessToken,
      });
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const LogOut = async (req, res) => {
  try {
    const client = extractClientInfo(req);

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ status: "fail", message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    blacklistedTokens.add(token);

    const admin = await Admin.findByIdAndUpdate(decoded.id, {
      isLoggedIn: false,
      lastLogoutAt: new Date(),
    });

    await addActivity(admin, "Logout", "Admin logged out", client);

    await admin.save();

    return res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({ status: "fail", message: error.message });
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
    admin.createdAt = new Date();

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

export const checkUnique = async (req, res) => {
  try {
    const { field, value, id } = req.body; // id = current user ID

    if (!field || !value) {
      return res.status(400).json({ message: "Invalid request" });
    }

    // Check if any other document has the same value for the field
    const query = { [field]: value };
    if (id) {
      query._id = { $ne: id }; // exclude current user
    }

    const exists = await Admin.findOne(query);
    res.json({ exists: !!exists });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const getAdminByID = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID is required",
      });
    }

    const admin = await Admin.findById(id).select(
      "fullName email role mobile profileImage username slug password createAt status lastLoginIp isLoggedIn"
    );

    if (admin.profileImage) {
      admin.profileImage = await getPresignedUrl(admin.profileImage, 3600);
    }
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Admin record fetched successfully!",
      data: {
        admin,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server error",
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const client = extractClientInfo(req);
    const {
      id,
      fullName,
      email,
      password,
      mobile,
      username,
      profileImage,
      slug,
      role,
    } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.fullName = fullName || admin.fullName;
    admin.email = email || admin.email;
    admin.role = role || admin.role;
    admin.mobile = mobile || admin.mobile;
    admin.username = username || admin.username;
    admin.slug = slug || admin.slug;
    admin.profileImage = profileImage || admin.profileImage;

    if (password) {
      admin.password = password;
    }

    admin.updatedAt = new Date();

    await addActivity(
      admin,
      "Admin Profile Updated",
      "Profile details updated successfully",
      client,
      "success"
    );

    await admin.save();

    res.status(200).json({ message: "Admin updated successfully", admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.body;
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    return res.status(200).json({ message: "Admin deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const toggleLockAdmin = async (req, res) => {
  try {
    const client = extractClientInfo(req);
    const { id } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.status = admin.status === "active" ? "locked" : "active";

    await addActivity(
      admin,
      "Admin Lock Toggle",
      `Status changed to ${admin.status}`,
      client,
      "success"
    );

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
    const { role, adminId } = req.body;
    if (!role || !adminId) {
      return res.status(400).json({
        status: "fail",
        message: "Role and adminId are required.",
      });
    }

    // Get admin document
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    const data = await DashboardStats.findOne({ role });
    if (!data)
      return res.status(404).json({
        status: "fail",
        message: "No stats found for this role.",
      });

    // AUTO COUNTS using embedded arrays
    const servicesCount = admin.services?.length || 0;
    const educationsCount = admin.education?.length || 0;
    const experiencesCount = admin.experience?.length || 0;
    const projectsCount = admin.projects?.length || 0;
    const messagesCount = admin.messages?.length || 0;

    // MAP COUNTS TO UI LABELS
    const updatedStats = data.stats.map((item) => {
      switch (item.label) {
        case "Services":
          return { ...item.toObject(), count: servicesCount };
        case "Education":
          return { ...item.toObject(), count: educationsCount };
        case "Experiences":
          return { ...item.toObject(), count: experiencesCount };
        case "Projects":
          return { ...item.toObject(), count: projectsCount };
        case "Messages":
          return { ...item.toObject(), count: messagesCount };
        default:
          return item;
      }
    });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: { stats: updatedStats },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Portfolio Home API
export const SavePortfolioHome = async (req, res) => {
  try {
    const { adminId, name, homeDescription, roles, profileImage } = req.body;

    if (!name || !homeDescription) {
      return res.status(400).json({
        status: "fail",
        message: "Name and Description are required",
      });
    }

    const admin = await Admin.findById(adminId);
    const isNew = !admin.home || !admin.home.name;

    if (!admin.home) admin.home = {};

    admin.home.name = name;
    admin.home.description = homeDescription;
    admin.home.roles = roles || [];

    if (profileImage) {
      admin.home.profileImage = profileImage;
    }

    if (!admin.home.createdAt) {
      admin.home.createdAt = new Date();
    }
    admin.home.updatedAt = new Date();

    await admin.save();

    return res.status(isNew ? 201 : 200).json({
      status: "success",
      action: isNew ? "Created" : "Updated",
      message: `Home section ${isNew ? "created" : "updated"} successfully`,
      data: admin.home,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const GetPortfolioHome = async (req, res) => {
  try {
    const adminId = req.body.id;
    const admin = await Admin.findById(adminId);

    if (!admin || !admin.home) {
      return res.status(404).json({
        status: "fail",
        message: "Home section not found",
      });
    }

    const home = admin.home.toObject();

    // Convert image to presigned URL
    if (home.profileImage) {
      const fileUrl = home.profileImage;
      const presignedUrl = await getPresignedUrl(fileUrl, 3600);
      home.profileImage = presignedUrl;
    } else {
      home.profileImage = null;
    }

    return res.status(200).json({
      status: "success",
      message: "Home data fetched successfully",
      data: { home: home },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Portfolio About API
export const SavePortfolioAbout = async (req, res) => {
  try {
    const { adminId, name, title, bio, bio2, profileImage, resumeFile, stats } =
      req.body;

    if (!name || !title || !bio) {
      return res.status(400).json({
        status: "fail",
        message: "Name, Title and Bio are required",
      });
    }

    const admin = await Admin.findById(adminId);

    const isNew = !admin.about || !admin.about.name;

    if (!admin.about) admin.about = {};

    admin.about.name = name;
    admin.about.title = title;
    admin.about.bio = bio;
    admin.about.bio2 = bio2 || "";
    // admin.about.profileImage = profileImage || "";
    // admin.about.resumeUrl = resumeUrl || "";

    if (profileImage) {
      admin.about.profileImage = profileImage;
    }

    if (resumeFile) {
      admin.about.resumeFile = resumeFile;
    }

    admin.about.stats = {
      experience: stats?.experience || 0,
      clients: stats?.clients || 0,
      recruiters: stats?.recruiters || 0,
    };

    // ⭐ FIX: only create createdAt once
    if (!admin.about.createdAt) {
      admin.about.createdAt = new Date();
    }
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

    if (!admin || !admin.about) {
      return res.status(404).json({
        status: "fail",
        message: "About section not found",
      });
    }

    const about = admin.about.toObject(); // convert mongoose document to plain object

    // ----------------------------------------------------
    // ✅ PROFILE IMAGE (Generate presigned URL)
    // ----------------------------------------------------
    if (about.profileImage) {
      const fileUrl = about.profileImage; // stored fileUrl
      const presignedUrl = await getPresignedUrl(fileUrl, 3600);
      about.profileImage = presignedUrl;
    } else {
      about.profileImage = null;
    }

    // ----------------------------------------------------
    // ✅ RESUME FILE (Generate presigned URL)
    // ----------------------------------------------------
    if (about.resumeFile) {
      const resumeUrl = about.resumeFile;
      const resumePresignedUrl = await getPresignedUrl(resumeUrl, 3600);
      about.resumeFile = resumePresignedUrl;
    } else {
      about.resumeFile = null;
    }

    return res.status(200).json({
      status: "success",
      message: "About data fetched successfully",
      data: { about: about },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Portfolio Educations API
export const AddEducation = async (req, res) => {
  try {
    const { adminId, degree, university, fromYear, toYear, currentlyStudying } =
      req.body;

    if (!adminId || !degree || !university || !fromYear) {
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
      fromYear,
      toYear,
      currentlyStudying,
      createdAt: new Date(),
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

    const sortedEducations = (admin.education || []).sort((a, b) => {
      // Use updatedAt if available, otherwise fall back to createdAt
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

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
    const {
      adminId,
      eduId,
      degree,
      university,
      fromYear,
      toYear,
      currentlyStudying,
    } = req.body;

    if (!adminId || !eduId || !degree || !university || !fromYear) {
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
      fromYear,
      toYear,
      currentlyStudying,
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
    const {
      adminId,
      company,
      role,
      fromYear,
      toYear,
      currentlyWorking,
      project,
      experienceDescription,
    } = req.body;

    if (
      !adminId ||
      !company ||
      !role ||
      !fromYear ||
      !project ||
      !experienceDescription
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

    const newExperience = {
      id: new mongoose.Types.ObjectId(),
      company,
      role,
      perfromYear,
      toYear,
      currentlyWorking,
      project,
      description: experienceDescription,
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

    const sortedExperiences = (admin.experience || []).sort((a, b) => {
      // Use updatedAt if available, otherwise fall back to createdAt
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

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
    const {
      adminId,
      expId,
      company,
      role,
      fromYear,
      toYear,
      currentlyWorking,
      project,
      experienceDescription,
    } = req.body;

    if (
      !adminId ||
      !expId ||
      !company ||
      !role ||
      !fromYear ||
      !project ||
      !experienceDescription
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
      fromYear,
      toYear,
      currentlyWorking,
      project,
      description: experienceDescription,
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

// Portfolio Skills API
export const AddPortfolioSkills = async (req, res) => {
  try {
    const { adminId, title, color, icon, skills } = req.body;

    if (!adminId || !title || !color || !icon || !skills) {
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

    const newSkills = {
      id: new mongoose.Types.ObjectId(),
      title,
      color,
      icon,
      skills,
      createdAt: new Date(),
    };

    admin.skills.push(newSkills);
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Skills added successfully",
      data: { newSkills: admin.skills },
    });
  } catch (err) {
    console.error("Add Projects Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioSkills = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    const sortedSkills = admin.skills || [];

    res.status(200).json({
      status: "success",
      message: "Skills data fetched successfully",
      data: { skills: sortedSkills || [] },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdatePortfolioSkills = async (req, res) => {
  try {
    const { adminId, skillId, title, color, icon, skills } = req.body;

    if (!adminId || !skillId || !title || !color || !icon || !skills) {
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

    const skillsIndex = admin.skills.findIndex(
      (e) => e._id.toString() === skillId
    );
    if (skillsIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Skills not found" });
    }

    // Update fields
    admin.skills[skillsIndex] = {
      ...admin.skills[skillsIndex],
      title,
      color,
      icon,
      skills,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Skill updated successfully",
      data: admin.skills[skillsIndex],
    });
  } catch (err) {
    console.error("Update skill Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeletePortfolioSkills = async (req, res) => {
  try {
    const { adminId, skillId } = req.body;

    if (!adminId || !skillId) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID and Skill ID are required",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const skillsIndex = admin.skills.findIndex(
      (e) => e._id.toString() === skillId
    );
    if (skillsIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Skills not found" });
    }

    const removedSkills = admin.projects.splice(skillsIndex, 1); // remove from array
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Skills deleted successfully",
      data: removedSkills[0],
    });
  } catch (err) {
    console.error("Delete Skills Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Projects API
export const AddPortfolioProjects = async (req, res) => {
  try {
    const {
      adminId,
      title,
      category,
      role,
      image,
      description,
      codeLink,
      previewLink,
    } = req.body;

    if (
      !adminId ||
      !title ||
      !category ||
      !role ||
      !image ||
      !codeLink ||
      !previewLink
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

    const newProjects = {
      id: new mongoose.Types.ObjectId(),
      title,
      category,
      role,
      image,
      description,
      codeLink,
      previewLink,
      createdAt: new Date(),
    };

    admin.projects.push(newProjects);
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Projects added successfully",
      data: { newProjects: admin.projects },
    });
  } catch (err) {
    console.error("Add Projects Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioProjects = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    const projects = admin.projects.map((project) => project.toObject());

    // Generate Pre-Signed URLs for each project's image
    const sortedProjects = await Promise.all(
      projects.map(async (proj) => {
        if (proj.image) {
          const presignedUrl = await getPresignedUrl(proj.image, 3600);
          proj.image = presignedUrl;
        } else {
          proj.image = null;
        }
        return proj;
      })
    );

    res.status(200).json({
      status: "success",
      message: "Projects data fetched successfully",
      data: { projects: sortedProjects || [] },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdatePortfolioProjects = async (req, res) => {
  try {
    const {
      adminId,
      projectId,
      title,
      category,
      role,
      image,
      description,
      codeLink,
      previewLink,
    } = req.body;

    if (!adminId || !projectId || !title || !category || !role || !image) {
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

    const projectsIndex = admin.projects.findIndex(
      (e) => e._id.toString() === projectId
    );
    if (projectsIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Projects not found" });
    }

    // Update fields
    admin.projects[projectsIndex] = {
      ...admin.projects[projectsIndex],
      adminId,
      projectId,
      title,
      category,
      role,
      image,
      description,
      codeLink,
      previewLink,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Projects updated successfully",
      data: admin.projects[projectsIndex],
    });
  } catch (err) {
    console.error("Update Projects Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeletePortfolioProjects = async (req, res) => {
  try {
    const { adminId, projectId } = req.body;

    if (!adminId || !projectId) {
      return res.status(400).json({
        status: "fail",
        message: "Admin ID and Projects ID are required",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ status: "fail", message: "Admin not found" });
    }

    const projectsIndex = admin.services.findIndex(
      (e) => e._id.toString() === projectId
    );
    if (projectsIndex === -1) {
      return res
        .status(404)
        .json({ status: "fail", message: "Projects not found" });
    }

    const removedProjects = admin.projects.splice(projectsIndex, 1); // remove from array
    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Projects deleted successfully",
      data: removedProjects[0],
    });
  } catch (err) {
    console.error("Delete Projects Error:", err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Contact Info API
export const AddPortfolioContactInfo = async (req, res) => {
  try {
    const {
      adminId,
      company,
      address,
      city,
      country,
      postalCode,
      email,
      phone,
      mapEmbedUrl,
      socialMedia,
    } = req.body;

    if (!adminId || !company || !email || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "Required fields missing",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    // Save single contact object
    admin.contactInfo = {
      location: {
        company,
        address,
        city,
        country,
        postalCode,
        mapEmbedUrl,
      },
      email,
      phone,
      socialMedia,
      createdBy: adminId,
      createdAt: new Date(),
    };

    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Contact added successfully",
      data: { contactInfo: admin.contactInfo },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPortfolioContactInfo = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    res.status(200).json({
      status: "success",
      message: "Data fetched",
      data: { contactInfo: admin.contactInfo || {} },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const UpdatePortfolioContactInfo = async (req, res) => {
  try {
    const {
      adminId,
      company,
      address,
      city,
      country,
      postalCode,
      email,
      phone,
      mapEmbedUrl,
      socialMedia,
    } = req.body;

    if (!adminId || !company || !email || !phone) {
      return res.status(400).json({
        status: "fail",
        message: "Required fields missing",
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    // Replace whole object
    admin.contactInfo = {
      location: {
        company,
        address,
        city,
        country,
        postalCode,
        mapEmbedUrl,
      },
      email,
      phone,
      socialMedia,
      createdBy: adminId,
      updatedAt: new Date(),
    };

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Contact updated",
      data: { contactInfo: admin.contactInfo },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const DeletePortfolioContactInfo = async (req, res) => {
  try {
    const { adminId } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    admin.contactInfo = null; // ❗ Clear object

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Contact info Deleted",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Portfolio Messages API
export const SaveContactMessage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, email, subject, message } = req.body;

    // 1️⃣ Find admin using slug
    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    // 2️⃣ Push message into admin.messages array
    admin.messages.push({
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
    });

    // Save
    await admin.save();

    res.status(201).json({
      status: "success",
      message: "Message saved successfully",
      data: admin.messages[admin.messages.length - 1], // return last added message
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const GetAllContactMessages = async (req, res) => {
  try {
    const { id } = req.body;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const sortedMessages = admin.messages.reverse();

    res.status(200).json({
      status: "success",
      message: "Received Messages Fetched!",
      data: { messages: sortedMessages },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

export const DeleteContactMessage = async (req, res) => {
  try {
    const { adminId, messageId } = req.body;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found",
      });
    }

    admin.messages = admin.messages.filter(
      (msg) => msg._id.toString() !== messageId
    );

    await admin.save();

    res.status(200).json({
      status: "success",
      message: "Message deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Public View Using Slug Api
export const GetPublicPortfolioHomeBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    const home = admin.home.toObject();

    // Convert image to presigned URL
    if (home.profileImage) {
      const fileUrl = home.profileImage;
      const presignedUrl = await getPresignedUrl(fileUrl, 3600);
      home.profileImage = presignedUrl;
    } else {
      home.profileImage = null;
    }

    res.status(200).json({
      status: "success",
      message: "Home data fetched successfully",
      data: { home: home },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioAboutBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    const about = admin.about.toObject(); // convert mongoose document to plain object

    // ----------------------------------------------------
    // ✅ PROFILE IMAGE (Generate presigned URL)
    // ----------------------------------------------------
    if (about.profileImage) {
      const fileUrl = about.profileImage; // stored fileUrl
      const presignedUrl = await getPresignedUrl(fileUrl, 3600);
      about.profileImage = presignedUrl;
    } else {
      about.profileImage = null;
    }

    // ----------------------------------------------------
    // ✅ RESUME FILE (Generate presigned URL)
    // ----------------------------------------------------
    if (about.resumeFile) {
      const resumeUrl = about.resumeFile;
      const resumePresignedUrl = await getPresignedUrl(resumeUrl, 3600);
      about.resumeFile = resumePresignedUrl;
    } else {
      about.resumeFile = null;
    }

    res.status(200).json({
      status: "success",
      message: "About & Skills data fetched successfully",
      data: { about: about },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioEducationsBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    const sortedEducations = (admin.education || []).sort((a, b) => {
      // Use updatedAt if available, otherwise fall back to createdAt
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.status(200).json({
      status: "success",
      message: "Educations data fetched successfully",
      data: { educations: sortedEducations },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioExperiencesBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    const sortedExperiences = (admin.experience || []).sort((a, b) => {
      // Use updatedAt if available, otherwise fall back to createdAt
      const dateA = a.updatedAt || a.createdAt;
      const dateB = b.updatedAt || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.status(200).json({
      status: "success",
      message: "Experiences data fetched successfully",
      data: { experiences: sortedExperiences },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioSkillsBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    res.status(200).json({
      status: "success",
      message: "About & Skills data fetched successfully",
      data: { skills: admin.skills || {} },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioServicesBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    console.log(admin);

    const sortedServices = admin.services || [];

    res.status(200).json({
      status: "success",
      message: "Services data fetched successfully",
      data: { services: sortedServices },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioProjectsBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    const projects = admin.projects.map((project) => project.toObject());

    // Generate Pre-Signed URLs for each project's image
    const sortedProjects = await Promise.all(
      projects.map(async (proj) => {
        if (proj.image) {
          const presignedUrl = await getPresignedUrl(proj.image, 3600);
          proj.image = presignedUrl;
        } else {
          proj.image = null;
        }
        return proj;
      })
    );

    res.status(200).json({
      status: "success",
      message: "Projects data fetched successfully",
      data: { projects: sortedProjects },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GetPublicPortfolioContactInfoBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const admin = await Admin.findOne({ slug });

    if (!admin) {
      return res.status(404).json({
        status: "fail",
        message: "Admin not found for this slug",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Contact Info data fetched successfully",
      data: { contactInfo: admin.contactInfo || {} },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

export const GenerateAI = async (req, res) => {
  try {
    const {
      field,
      title,
      experience,
      category,
      role,
      company,
      project,
      name,
      roles,
      prompt,
    } = req.body;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let usage = await AiUsage.findOne({ month, year });
    if (!usage)
      usage = await AiUsage.create({ month, year, requestsThisMonth: 0 });

    if (usage.requestsThisMonth >= 25) {
      return res.status(403).json({
        status: "fail",
        message: "AI request limit reached for this month (25 max)",
        remaining: 0,
      });
    }

    let finalPrompt = "";

    switch (field) {
      case "bio":
        finalPrompt = `
Write a professional portfolio bio in first person, only 2–3 lines.
Focus on who I am, my role, skills expertise and experience.
Avoid any headings, bullet points, or extra formatting.
Title: ${title || ""}
Experience: ${experience || ""}
Extra: ${prompt || ""}
`;
        break;

      case "bio2":
        finalPrompt = `
Write a short personal bio in first person, only 2–3 lines.
Focus on passion, motivation, work style and future goals.
Avoid any headings, bullet points, or formatting.
Extra: ${prompt || ""}
`;
        break;

      case "homeDescription":
        finalPrompt = `
Write a strong personal intro for my portfolio home section, 2–3 lines only.
Explain what I do and what makes me valuable, in first person.
No headings or bullet points.
Name: ${name || ""}
Roles: ${roles || ""}
Extra: ${prompt || ""}
`;
        break;

      case "experienceDescription":
        finalPrompt = `
Write a short experience description in first person, 2–3 lines only.
Company: ${company || ""}
Role: ${role || ""}
Project: ${project || ""}
Focus on responsibilities and measurable impact.
No headings or bullet points.
`;
        break;

      case "description": // project description
        finalPrompt = `
Write a short project description in first person, max 2–3 lines.
Explain my contribution and the value delivered.
No headings or bullet points.
Project: ${title || ""}
Category: ${category || ""}
Role: ${role || ""}
Extra: ${prompt || ""}
`;
        break;

      default:
        finalPrompt = `
Write a short professional sentence in first person, 2–3 lines only.
Avoid headings or bullet points.
Info: ${prompt || ""}
`;
    }

    const aiText = await generateBioFromGemini(finalPrompt);

    usage.requestsThisMonth += 1;
    await usage.save();
    const remaining = 25 - usage.requestsThisMonth;

    res.status(201).json({
      status: "success",
      message: `AI generated successfully. Remaining requests: ${remaining}`,
      data: { aiText },
      remaining,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "fail", message: err.message });
  }
};
