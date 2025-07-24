import { Popup } from "../Models/popupModel.js";

const cleanPayload = (payload) => {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([_, val]) => val !== null && val !== undefined && val !== ""
    )
  );
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
      textMessage,
      uploadedFile,
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

    payload = cleanPayload(payload);

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

    const popupDetails = await Popup.find({
      employee: employee,
      isActive: true,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: popupDetails,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const getAllPopupDetails = async (req, res) => {
  try {
    const popupList = await Popup.find().select("-__v");

    return res.status(200).json({
      status: "success",
      message: "Popup details fetched successfully",
      data: {
        popupList
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

    if (!id) return res.status(400).json({ message: "Popup ID is required" });

    const updateData = {};

    if (name?.trim()) updateData.name = name;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (country) updateData.country = country;
    if (role) updateData.role = role;
    if (gender) updateData.gender = gender;
    if (Array.isArray(employee) && employee.length > 0)
      updateData.employee = employee;

    if (popupType) updateData.popupType = popupType;

    if (popupType === "text" && textMessage?.trim()) {
      updateData.textMessage = textMessage;
    }

    if (popupType === "file" && uploadedFile?.trim()) {
      updateData.uploadedFile = uploadedFile;
    }

    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const updatedPopup = await Popup.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
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

export {
  savePopupDetails,
  getEmployeePopupDetails,
  getAllPopupDetails,
  updatePopupDetails,
  deletePopupDetails,
};
