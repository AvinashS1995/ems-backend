import { Approval } from "../Models/approvalSchema.js";

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
        message: "Approval config not found." 
      });
    }

    res.status(200).json({
      status: "success",
      message: "Approval Flow Updated Successfully",
      data: {
        updatedApproval
      },
    });

  } catch (err) {
    res.status(500).json({ 
      status: "fail", 
      message: err.message 
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
        message: "Approval config not found." 
      });
    }

    res.status(200).json({
      status: "success",
      message: "Approval Flow Deleted Successfully",
    });

  } catch (err) {
    res.status(500).json({ 
      status: "fail", 
      message: err.message 
    });
  }
};

export { saveApprovalDetails, getAllApprovalDetails, updateApprovalDetails, deleteApprovalDetails};
