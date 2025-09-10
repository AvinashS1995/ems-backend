import { getApprovalStepEmployees } from "../common/employee.utilis.js";
import { ApprovalFlow } from "../Models/approvalModel.js";
import { Holidays } from "../Models/holidayModel.js";
import { Leave, LeaveBalance } from "../Models/leaveModel.js";
import { User } from "../Models/UserModel.js";
import { sendLeaveEmail } from "../mail/sendMailLeaveStatusToEmployee.js";

const typeMap = {
  "Paid Leaves (PL)": "Leave",
  "Sick Leave (SL)": "Leave",
  "Casual Leave (CL)": "Leave",
  "Maternity Leave (ML)": "Leave",
  "Paternity Leave (PTL)": "Leave",
  "Bereavement Leave (BL)": "Leave",
  "Compensatory Off": "Leave",
  "Marriage Leave (MRL)": "Leave",
  "Leave Without Pay (LWP)": "Leave",
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

    console.log(leaveType);
    if (
      leaveType === "Casual Leave (CL)" ||
      leaveType === "Sick Leave (SL)" ||
      leaveType === "Paid Leaves (PL)"
    ) {
      const leaveBalance = await LeaveBalance.findOne({ empNo });
      console.log(leaveDuration);
      if (leaveBalance) {
        let days = 0;
        if (leaveDuration === "Full Day") {
          days = 1;
        } else if (leaveDuration === "Half Day") {
          days = 0.5;
        } else {
          return res.status(400).json({
            status: "fail",
            message: "Invalid leave duration. Allowed: Full Day or Half Day",
          });
        }

        const diffDays =
          (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

        const totalDays = diffDays * days;

        if (leaveType.includes("Casual")) {
          leaveBalance.casualLeave = Math.max(
            Number(leaveBalance.casualLeave || 0) - totalDays,
            0
          );
        } else if (leaveType.includes("Sick")) {
          leaveBalance.sickLeave = Math.max(
            Number(leaveBalance.sickLeave || 0) - totalDays,
            0
          );
        } else if (leaveType.includes("Paid")) {
          leaveBalance.paidLeave = Math.max(
            Number(leaveBalance.paidLeave || 0) - totalDays,
            0
          );
        }

        await leaveBalance.save();
      }
    }

    // 3. Fetch approval flow
    const approvalFlow = await ApprovalFlow.findOne({ typeName });
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
      return res.status(400).json({
        status: "fail",
        message: `Approval mapping not found for leave type: ${leave.leaveType}`,
      });
    }

    const approvalFlow = await ApprovalFlow.findOne({ typeName });
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
        stepperData,
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
          status: "Pending",
        },
      },
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
      return res
        .status(404)
        .json({ status: "fail", message: "Leave not found" });
    }

    const approver = await User.findOne({ empNo: approverEmpNo });
    if (!approver) {
      return res
        .status(404)
        .json({ status: "fail", message: "Approver not found" });
    }

    const { role } = approver;

    const alreadyActed = leave.approvalStatus.find(
      (step) =>
        step.empNo === approverEmpNo &&
        step.role === role &&
        step.status !== "Pending"
    );

    if (alreadyActed) {
      return res
        .status(400)
        .json({ status: "fail", message: "You have already taken action" });
    }

    // Remove old pending entry
    leave.approvalStatus = leave.approvalStatus.filter(
      (s) =>
        !(
          s.empNo === approverEmpNo &&
          s.role === role &&
          s.status === "Pending"
        )
    );

    // Add current approver action
    leave.approvalStatus.push({
      role,
      empNo: approverEmpNo,
      name: `${approver.firstName} ${approver.lastName}`,
      status: action === "Approved" ? "Approved" : "Rejected",
      comments,
      actionDate: new Date(),
    });

    const typeName = typeMap[leave.leaveType];
    const approvalFlow = await ApprovalFlow.findOne({ typeName });
    const flowSteps = approvalFlow?.listApprovalFlowDetails || [];

    // Get stepper
    const stepperData = await getApprovalStepEmployees(
      leave.empNo,
      flowSteps,
      leave.approvalStatus,
      approver.role
    );

    // Find next pending approver
    const nextPending = stepperData.find((step) => step.status === "Pending");

    const applicant = await User.findOne({ empNo: leave.empNo });

    if (action === "Rejected") {
      leave.status = `Rejected by ${role}`;

      const leaveBalance = await LeaveBalance.findOne({ empNo: leave.empNo });
      if (leaveBalance) {
        const leaveDays =
          Math.ceil(
            (new Date(leave.toDate) - new Date(leave.fromDate)) /
              (1000 * 60 * 60 * 24)
          ) + 1; // inclusive days

        if (leave.leaveType.includes("Casual")) {
          leaveBalance.casualLeave += leaveDays;
        } else if (leave.leaveType.includes("Sick")) {
          leaveBalance.sickLeave += leaveDays;
        } else if (leave.leaveType.includes("Paid")) {
          leaveBalance.paidLeave += leaveDays;
        }

        await leaveBalance.save();
      }

      if (applicant) {
        // await Popup.create({
        //   name: "Leave Rejected",
        //   startDate: new Date(),
        //   endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        //   startTime: "12:00 AM",
        //   endTime: "11:59 PM",
        //   country: applicant.country || "India",
        //   role: applicant.role,
        //   gender: applicant.gender,
        //   employee: applicant.empNo,
        //   popupType: "text",
        //   textMessage: "Your leave has been rejected.",
        //   isActive: true,
        // });

        await sendLeaveEmail({
          to: applicant.email,
          name: `${applicant.firstName} ${applicant.lastName}`,
          status: "Rejected",
        });
      }
    } else if (!nextPending) {
      leave.status = "Approved";

      if (applicant) {
        await sendLeaveEmail({
          to: applicant.email,
          name: `${applicant.firstName} ${applicant.lastName}`,
          status: "Approved",
        });
      }
    }

    if (action === "Rejected") {
      leave.status = `Rejected by ${role}`;
    } else if (!nextPending) {
      leave.status = "Approved";
    } else {
      // Check if already exists in approvalStatus
      const alreadyExists = leave.approvalStatus.some(
        (s) => s.empNo === nextPending.empNo && s.role === nextPending.role
      );

      if (!alreadyExists) {
        leave.approvalStatus.push({
          role: nextPending.role,
          empNo: nextPending.empNo,
          name: nextPending.name.split(" - ")[0],
          status: "Pending",
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
      status: "success",
      message: `Leave ${action}ed successfully`,
      data: updatedLeave,
    });
  } catch (error) {
    console.error("Error in approveRejectLeave:", error);
    res.status(500).json({ status: "fail", message: error.message });
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

// Create leave balance (pro-rata calculation)
const createLeaveBalance = async (req, res) => {
  try {
    const { empNo, doj } = req.body;

    const joiningDate = new Date(doj);
    const remainingMonths = 12 - joiningDate.getMonth();

    const casualLeave = Math.round((7 / 12) * remainingMonths);
    const sickLeave = Math.round((7 / 12) * remainingMonths);
    const paidLeave = Math.round((15 / 12) * remainingMonths);

    const leaveBalance = new LeaveBalance({
      empNo,
      casualLeave,
      sickLeave,
      paidLeave,
    });

    await leaveBalance.save();
    res.status(201).json({
      status: "success",
      message: "Successfully Leave Balance Created!",
      data: { leaveBalance },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get leave balance by employee
const getLeaveBalance = async (req, res) => {
  try {
    const { empNo } = req.body;
    const leaveBalance = await LeaveBalance.findOne({ empNo });

    if (!leaveBalance) {
      return res.status(404).json({
        status: "fail",
        message: "Leave balance not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Successfully Leave Balance Fetched!",
      data: {
        leaveBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
};

// Update leave balance
const updateLeaveBalance = async (req, res) => {
  try {
    const { empNo, type, days } = req.body;

    const leaveBalance = await LeaveBalance.findOne({ empNo });
    if (!leaveBalance) {
      return res
        .status(404)
        .json({ status: "fail", message: "Leave balance not found" });
    }

    if (leaveBalance[type] !== undefined) {
      leaveBalance[type] = Math.max(leaveBalance[type] - days, 0);
    } else {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid leave type" });
    }

    await leaveBalance.save();
    res.status(200).json({
      status: "success",
      message: "Successfully Leave Balance Updated!",
      data: {
        leaveBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get all employees leave balances
const getAllLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find();
    res.status(200).json({
      success: "success",
      message: "Record(s) Fetched Successfully!",
      data: { balances },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  GetUpcomingHolidays,
  saveEmployeeLeave,
  approvalFlow,
  LeaveRequestList,
  approveRejectLeave,
  getAllLeaves,
  createLeaveBalance,
  getLeaveBalance,
  updateLeaveBalance,
  getAllLeaveBalances,
};
