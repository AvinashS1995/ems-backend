import modelMap from "../common/allModels.js";
import { ApprovalFlow } from "../Models/approvalModel.js";
import mongoose from "mongoose";

const saveApprovalDetails = async (req, res) => {
  try {
    const { type, typeName, displayName, listApprovalFlowDetails } = req.body;

    const exists = await ApprovalFlow.findOne({ type }).lean();

    if (exists) {
      return res.status(400).json({
        status: "fail",
        message: "Approval flow for this type already exists.",
      });
    }

    const newApproval = new ApprovalFlow({
      type,
      typeName,
      displayName,
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

    const approvals = await ApprovalFlow.find(query)
      .sort({ createdAt: -1 })
      .lean();

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
    const { id, type, typeName, displayName, listApprovalFlowDetails } =
      req.body;

    const updatedApproval = await ApprovalFlow.findByIdAndUpdate(
      id,
      {
        type,
        typeName,
        displayName,
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

    const deletedApproval = await ApprovalFlow.findByIdAndDelete(id);

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

    const approvals = await ApprovalFlow.find({}).lean();
    const approvalList = [];

    for (const approval of approvals) {
      const { type, typeName, displayName } = approval;

      let count = 0;

      try {
        const Model = mongoose.model(typeName);

        count = await Model.countDocuments({
          approvalFlowId: approval._id,
          approvalStatus: {
            $elemMatch: {
              empNo: approverEmpNo,
              status: "Pending",
            },
          },
        });
      } catch (err) {
        console.warn(`Model not found for typeName: ${typeName}`);
        console.log(err);
      }
      if (count > 0) {
        approvalList.push({
          applicationType: type,
          applicationTypeName: typeName,
          applicationDisplayName: displayName,
          typeCount: count,
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      totalRecords: approvalList.length,
      data: {
        approvalList,
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

const getAllModels = async (req, res) => {
  try {
    const models = Object.keys(modelMap);

    const modelList = models.map((name, index) => ({
      id: index + 1,
      modelName: name,
    }));

    return res.status(200).json({
      status: "success",
      message: "Record(s) Successfully Fetched",
      totalRecords: modelList.length,
      data: {
        models: modelList,
      },
    });
  } catch (error) {
    console.error("Error fetching models:", error);
    return res.status(500).json({
      status: "fail",
      message: "Server error",
    });
  }
};

export {
  saveApprovalDetails,
  getAllApprovalDetails,
  updateApprovalDetails,
  deleteApprovalDetails,
  getEmpApprovalList,
  getAllModels,
};
