import { getApprovalStepEmployees } from "../common/employee.utilis.js";
import { Approval } from "../Models/approvalSchema.js";
import { Holidays } from "../Models/holidayModel.js";
import { Leave } from "../Models/leaveModel.js";
import { User } from "../Models/UserModel.js";

const typeMap = {
  "Paid Leaves (PL)": "Leave Request",
  "Sick Leave (SL)": "Leave Request",
  "Casual Leave (CL)": "Leave Request",
  "Maternity Leave (ML)": "Leave Request", // ✅ Fixed
  "Paternity Leave (PTL)": "Leave Request",
  "Bereavement Leave (BL)": "Leave Request",
  "Compensatory Off": "Leave Request",
  "Marriage Leave (MRL)": "Leave Request",
  "Leave Without Pay (LWP)": "Leave Request",
};

const GetUpcomingHolidays = async (req, res) => {
  try {
    const today = new Date();
    const holidays = await Holidays.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .select("-__v");

    if (!holidays) {
      return res.status(404).json({
        status: "fail",
        message: "Holidays Not Found..!",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Successfully Fetched..!",
      data: {
        upComingHolidays: holidays,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const saveEmployeeLeave = async (req, res) => {
  try {
    const {
      empNo,
      name,
      leaveType,
      leaveDuration,
      fromDate,
      toDate,
      reasonType,
      reasonComment,
    } = req.body;

    // 1. Fetch the employee
    const employee = await User.findOne({ empNo });
    if (!employee) {
      return res.status(404).json({
        status: "fail",
        message: "Employee not found",
      });
    }

    // 2. Map leaveType to approval typeName
    const typeName = typeMap[leaveType];
    if (!typeName) {
      return res.status(400).json({
        status: "fail",
        message: `Approval mapping not found for leave type: ${leaveType}`,
      });
    }

    // 3. Fetch approval flow
    const approvalFlow = await Approval.findOne({ typeName });
    if (!approvalFlow) {
      return res.status(404).json({
        status: "fail",
        message: `Approval flow not found for ${leaveType}`,
      });
    }

    // 4. Insert the "Submitted" entry for the applicant
    const initialStatus = [
      {
        role: employee.role,
        empNo,
        name,
        status: "Submitted",
        comments: reasonComment,
        actionDate: new Date(),
      },
    ];

    // 5. Get the approval stepper data, skipping self from reapproval
    const stepperData = await getApprovalStepEmployees(
      empNo,
      approvalFlow.listApprovalFlowDetails,
      initialStatus,
      employee.role // this role will be skipped in stepper
    );

    // 6. Construct the full approvalStatus array
    const approvalStatus = [
      ...initialStatus,
      ...stepperData.map((step) => ({
        role: step.role,
        empNo: step.empNo,
        name: step.name.split(" - ")[0],
        status: step.status,
        comments: step.comments,
        actionDate: step.actionDate,
      })),
    ];

    // 7. Determine initial status
    const pendingStep = stepperData.find((s) => s.status === "Pending");
    const status = pendingStep ? `Pending for ${pendingStep.role}` : "Approved";

    // 8. Save the leave record
    const newLeave = new Leave({
      empNo,
      name,
      leaveType,
      leaveDuration,
      fromDate,
      toDate,
      reasonType,
      reasonComment,
      status,
      approvalStatus,
    });

    const savedLeave = await newLeave.save();

    // 9. Respond
    res.status(201).json({
      message: "Leave application submitted successfully",
      data: {
        savedLeave,
      },
    });

  } catch (error) {
    console.error("Error in saveEmployeeLeave:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const approvalFlow = async (req, res) => {
  try {
    const { leaveId } = req.body;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        status: "fail",
        message: "Leave not found",
      });
    }

    const employee = await User.findOne({ empNo: leave.empNo });

    if (!employee) {
      return res.status(404).json({
        status: "success",
        message: "Employee not found",
      });
    }

    // Map leaveType to ApprovalFlow.typeName
    const typeName = typeMap[leave.leaveType];
    if (!typeName) {
      return res
        .status(400)
        .json({
          status: "fail",
          message: `Approval mapping not found for leave type: ${leave.leaveType}`,
        });
    }

    const approvalFlow = await Approval.findOne({ typeName });
    console.log(approvalFlow);
    if (!approvalFlow) {
      return res
        .status(404)
        .json({ status: "fail", message: "Approval flow not found" });
    }

    const stepperData = await getApprovalStepEmployees(
      employee.empNo,
      approvalFlow.listApprovalFlowDetails,
      leave.approvalStatus,
      employee.role
    );

    // You can send back relevant info about the approval flow:
    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        // leave,
        stepperData,
        // empNo: leave.empNo,
        // name: leave.name,
        // reasonComment: leave.reasonComment,
        // createAt: leave.createAt,
        // leaveStatus: leave.status,
        // approverComment: leave.approverComment,
        // updatedBy: leave.updatedBy,
        // updateAt: leave.updateAt,
        // appliedBy: leave.appliedBy || `${leave.empNo} - ${leave.name}`,
        // tlApprover: user.teamLeader,
        // managerApprover: user.manager,
        // hrApprover: user.hr,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const LeaveRequestList = async (req, res) => {
  try {
    const { approverEmpNo } = req.body;

    const leaves = await Leave.find({
      approvalStatus: {
        $elemMatch: {
          empNo: approverEmpNo,
          status: "Pending"
        }
      }
    }).sort({ createAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        leaves,
        totalRecords: leaves.length,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};



const approveRejectLeave = async (req, res) => {
  try {
    const { leaveId, action, comments, approverEmpNo } = req.body;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ status: 'fail', message: 'Leave not found' });
    }

    const approver = await User.findOne({ empNo: approverEmpNo });
    if (!approver) {
      return res.status(404).json({ status: 'fail', message: 'Approver not found' });
    }

    const { role } = approver;

    const alreadyActed = leave.approvalStatus.find(
      (step) => step.empNo === approverEmpNo && step.role === role && step.status !== 'Pending'
    );

    if (alreadyActed) {
      return res.status(400).json({ status: 'fail', message: 'You have already taken action' });
    }

    // Remove old pending entry
    leave.approvalStatus = leave.approvalStatus.filter(
      (s) => !(s.empNo === approverEmpNo && s.role === role && s.status === 'Pending')
    );

    // Add current approver action
    leave.approvalStatus.push({
      role,
      empNo: approverEmpNo,
      name: `${approver.firstName} ${approver.lastName}`,
      status: action === 'Approved' ? 'Approved' : 'Rejected',
      comments,
      actionDate: new Date(),
    });

    const typeName = typeMap[leave.leaveType];
    const approvalFlow = await Approval.findOne({ typeName });
    const flowSteps = approvalFlow?.listApprovalFlowDetails || [];

    // Get stepper
    const stepperData = await getApprovalStepEmployees(
      leave.empNo,
      flowSteps,
      leave.approvalStatus,
      approver.role
    );

    // Find next pending approver
    const nextPending = stepperData.find((step) => step.status === 'Pending');

    if (action === 'Rejected') {
      leave.status = `Rejected by ${role}`;
    } else if (!nextPending) {
      leave.status = 'Approved';
    } else {
      // Check if already exists in approvalStatus
      const alreadyExists = leave.approvalStatus.some(
        (s) => s.empNo === nextPending.empNo && s.role === nextPending.role
      );

      if (!alreadyExists) {
        leave.approvalStatus.push({
          role: nextPending.role,
          empNo: nextPending.empNo,
          name: nextPending.name.split(' - ')[0], // clean name
          status: 'Pending',
          comments: null,
          actionDate: null,
        });
      }

      leave.status = `Pending for ${nextPending.role}`;
    }

    leave.updatedBy = approverEmpNo;
    leave.updateAt = new Date();

    const updatedLeave = await leave.save();

    res.status(200).json({
      status: 'success',
      message: `Leave ${action}ed successfully`,
      data: updatedLeave,
    });

  } catch (error) {
    console.error("Error in approveRejectLeave:", error);
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const { empNo, status, fromDate, toDate } = req.body;

    let query = {};

    if (empNo) query.empNo = empNo;
    if (status) query.status = status;
    if (fromDate && toDate) {
      query.fromDate = { $gte: new Date(fromDate) };
      query.toDate = { $lte: new Date(toDate) };
    }

    const leaves = await Leave.find(query).sort({ createAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully!",
      data: {
        leaves,
        totalRecords: leaves.length,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};


export {
  GetUpcomingHolidays,
  saveEmployeeLeave,
  approvalFlow,
  LeaveRequestList,
  approveRejectLeave,
  getAllLeaves,
};
