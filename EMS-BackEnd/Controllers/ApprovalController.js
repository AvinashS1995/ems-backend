import { Approval } from "../Models/approvalModel.js";
import mongoose from "mongoose";

const saveApprovalDetails = async (req, res) => {
  try {
    const { type, typeName, listApprovalFlowDetails } = req.body;

    const exists = await Approval.findOne({ type }).lean();

    if (exists) {
      return res.status(400).json({
        status: "fail",
        message: "Approval flow for this type already exists.",
      });
    }

    const newApproval = new Approval({
      type,
      typeName,
      listApprovalFlowDetails,
    });

    await newApproval.save();

    res.status(201).json({
      status: "success",
      message: "Approval Flow Created Successfully",
      data: {
        newApproval,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

const getAllApprovalDetails = async (req, res) => {
  try {
    const { typeName } = req.body;

    const query = {};

    if (typeName) {
      query.typeName = typeName;
    }

    const approvals = await Approval.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      status: "success",
      data: {
        approvals,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const updateApprovalDetails = async (req, res) => {
  try {
    const { id, type, typeName, listApprovalFlowDetails } = req.body;

    const updatedApproval = await Approval.findByIdAndUpdate(
      id,
      {
        type,
        typeName,
        listApprovalFlowDetails,
      },
      { new: true, runValidators: true }
    );

    if (!updatedApproval) {
      return res.status(404).json({
        status: "fail",
        message: "Approval config not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Approval Flow Updated Successfully",
      data: {
        updatedApproval,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const deleteApprovalDetails = async (req, res) => {
  try {
    const { id } = req.body;

    const deletedApproval = await Approval.findByIdAndDelete(id);

    if (!deletedApproval) {
      return res.status(404).json({
        status: "fail",
        message: "Approval config not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Approval Flow Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getEmpApprovalList = async (req, res) => {
  try {
    const { approverEmpNo } = req.body;

    if (!approverEmpNo) {
      return res.status(400).json({
        status: "fail",
        message: "Approver empNo is required",
      });
    }

    const approvals = await Approval.find({}).lean();
    const approvalList = [];

    for (const approval of approvals) {
      const { type, typeName } = approval;

      let count = 0;

      try {
        const Model = mongoose.model(typeName);

        count = await Model.countDocuments({
          approvalStatus: {
            $elemMatch: {
              empNo: approverEmpNo,
              status: "Pending",
            },
          },
        });
      } catch (err) {
        console.warn(`Model not found for typeName: ${typeName}`);
      }
      if (count > 0) {
        approvalList.push({
          applicationType: type,
          applicationTypeName: typeName,
          typeCount: count,
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      totalRecords: approvalList.length,
      data: {
        approvalList
      },
    });
  } catch (error) {
    console.error("Error in getEmpApprovalList:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export {
  saveApprovalDetails,
  getAllApprovalDetails,
  updateApprovalDetails,
  deleteApprovalDetails,
  getEmpApprovalList,
};
