import { getCurrentMinutes, parseTime } from "../common/timeHelper.js";
import { Popup } from "../Models/popupModel.js";
import { getPresignedUrl } from "../storage/s3.config.js";
import { User } from "../Models/UserModel.js";

const normalizePayload = (payload) => {
  const normalized = {};
  for (const key in payload) {
    if (payload[key] === undefined || payload[key] === null) {
      normalized[key] = "";
    } else {
      normalized[key] = payload[key];
    }
  }
  return normalized;
};

const savePopupDetails = async (req, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      country,
      role,
      gender,
      employee,
      popupType,
      textMessage,
      uploadedFile,
      isActive,
    } = req.body;

    if (popupType === "text" && !textMessage) {
      return res.status(400).json({
        status: "fail",
        message: "Text Message is required for text popup",
      });
    }

    if (popupType === "file" && !uploadedFile) {
      return res.status(400).json({
        status: "fail",
        message: "File is required for file popup",
      });
    }

    let payload = {
      popupType,
      textMessage: popupType === "text" ? textMessage : "",
      uploadedFile: popupType === "file" ? uploadedFile : "",
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      country,
      role,
      gender,
      employee,
      isActive,
    };

    payload = normalizePayload(payload);

    const newPopupData = new Popup(payload);

    const newPopup = await newPopupData.save();

    res.status(201).json({
      status: "success",
      message: "Popup data Created Successfully!",
      data: {
        newPopup,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};


const getEmployeePopupDetails = async (req, res) => {
  try {
    const { employee } = req.body;

    if (!employee) {
      return res.status(400).json({
        status: "fail",
        message: "Employee ID is required",
      });
    }

    // Get employee data
    const user = await User.findOne({ empNo: employee });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Employee not found",
      });
    }

    const now = new Date();
    const currentDate = new Date(now.toISOString().split("T")[0]);
    const nowMinutes = getCurrentMinutes();

    // Get all active popups in valid date range
    const activePopups = await Popup.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).sort({ createdAt: 1 });

    // Normalize helper
    const normalize = (val) =>
      typeof val === "string" ? val.trim().toLowerCase() : "";

    const userCountry = normalize(user.country);
    const userRole = normalize(user.role);
    const userGender = normalize(user.gender);
    const userEmpNo = user.empNo?.trim();

    // Filter by access rules (country, role, gender, employee)
    const visiblePopups = activePopups.filter((popup) => {
      const popupCountry = normalize(popup.country);
      const popupRole = normalize(popup.role);
      const popupGender = normalize(popup.gender);
      const popupEmpNo = popup.employee?.trim();

      const matchCountry =
        !popup.country ||
        popupCountry === "all" ||
        popupCountry === userCountry;

      const matchRole =
        !popup.role || popupRole === "all" || popupRole === userRole;

      const matchGender =
        !popup.gender || popupGender === "all" || popupGender === userGender;

      const matchEmployee =
        !popup.employee ||
        popupEmpNo === "all" ||
        popupEmpNo === userEmpNo;

      return matchCountry && matchRole && matchGender && matchEmployee;
    });

    // Filter by time
    const filteredPopups = visiblePopups.filter((popup) => {
      const startMinutes = parseTime(popup.startTime);
      const endMinutes = parseTime(popup.endTime);

      if (startMinutes > endMinutes) {
        return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
      } else {
        return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
      }
    });

    // Attach file URL if popupType is file
    const popupList = await Promise.all(
      filteredPopups.map(async (popup) => {
        if (popup.uploadedFile) {
          const presignedUrl = await getPresignedUrl(
            popup.uploadedFile,
            3600
          );
          popup.uploadedFile = presignedUrl;
        } else {
          popup.uploadedFile = null;
        }
        return popup;
      })
    );

    // Debug log
    console.log("User:", userRole, userGender, userEmpNo, userCountry);
    console.log("Visible popups:", visiblePopups.map((p) => p.name));
    console.log("Final popups after time filter:", popupList.length);

    return res.status(200).json({
      status: "success",
      message: "Filtered popups retrieved successfully",
      data: popupList,
    });
  } catch (error) {
    console.error("Error in getEmployeePopupDetails:", error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const getAllPopupDetails = async (req, res) => {
  try {
    const { startDate, endDate, role, isActive, popupType } = req.body;

    const query = {};

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (role) {
      query.role = role;
    }

    if (typeof isActive === "boolean") {
      query.isActive = isActive;
    }

    if (popupType) {
      query.popupType = popupType;
    }

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Popup.countDocuments();

    const popup = await Popup.find(query)
      .skip(skip)
      .limit(limit)
      .select("-__v");

    const popupList = await Promise.all(
      popup.map(async (popup) => {
        if (popup.uploadedFile) {
          const fileKey = popup.uploadedFile;
          const presignedUrl = await getPresignedUrl(fileKey, 3600);
          popup.uploadedFile = presignedUrl;
        } else {
          popup.uploadedFile = null;
        }
        return popup;
      })
    );

    return res.status(200).json({
      status: "success",
      message: "Popup details fetched successfully",
      data: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        popupList,
      },
    });
  } catch (error) {
    console.error("Error fetching popup details:", error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const updatePopupDetails = async (req, res) => {
  try {
    const {
      id,
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      country,
      role,
      gender,
      employee,
      popupType,
      textMessage,
      uploadedFile,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Popup ID is required",
      });
    }

    const updateData = {
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      country,
      role,
      gender,
      employee,
      popupType,
      textMessage: popupType === "text" ? textMessage : "",
      uploadedFile: popupType === "file" ? uploadedFile : "",
      isActive,
    };

    const finalUpdate = normalizePayload(updateData);

    const updatedPopup = await Popup.findByIdAndUpdate(id, finalUpdate, {
      new: true,
    });

    if (!updatedPopup) {
      return res.status(404).json({
        status: "fail",
        message: "Popup not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Popup updated successfully",
      data: {
        updatedPopup,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deletePopupDetails = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id)
      return res.status(400).json({
        status: "fail",
        message: "Popup ID is required",
      });

    const deleted = await Popup.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Popup not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Popup deleted successfully",
      data: {
        deleted,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const togglePopupStatus = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "Popup ID is required",
      });
    }

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        status: "fail",
        message: "Popup not found",
      });
    }

    popup.isActive = !popup.isActive;
    await popup.save();

    return res.status(200).json({
      status: "success",
      message: `Popup status updated to ${
        popup.isActive ? "Active" : "Inactive"
      }`,
      data: { isActive: popup.isActive },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export {
  savePopupDetails,
  getEmployeePopupDetails,
  getAllPopupDetails,
  updatePopupDetails,
  deletePopupDetails,
  togglePopupStatus,
};
