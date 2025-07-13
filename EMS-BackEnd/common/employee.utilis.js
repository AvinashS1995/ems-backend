import { User, UserReporting } from "../Models/UserModel.js";

const getApprovalStepEmployees = async (
  employeeID,
  flow,
  approvalStatus = [],
  applicantRole
) => {
  let currentEmpId = employeeID;
  const result = [];
  let pendingEncountered = false;

  // ✅ Add submitted applicant as first step
  const applicant = await User.findOne({ empNo: employeeID });
  if (applicant) {
    result.push({
      role: applicantRole,
      empNo: applicant.empNo,
      name: `${applicant.firstName} ${applicant.lastName} - [${applicant.empNo}]`,
      approveBy: applicant.empNo,
      comments: approvalStatus[0]?.comments || null,
      actionDate: approvalStatus[0]?.actionDate || null,
      status: approvalStatus[0]?.status || "Submitted",
    });
  }

  // ✅ Find the role index and skip it (applicant already added)
  let startIndex = flow.findIndex((step) => step.role === applicantRole);
  if (startIndex === -1) {
    throw new Error(`Applicant role '${applicantRole}' not found in approval flow`);
  }
  startIndex += 1;

  // 🔁 Continue rest of the flow
  for (let i = startIndex; i < flow.length; i++) {
    const roleStep = flow[i];
    let foundEmp = null;

    // Try from reporting chain
    const reporting = await UserReporting.findOne({ employee: currentEmpId });
    if (reporting) {
      currentEmpId = reporting.reportedByEmployee;
      const candidate = await User.findOne({ empNo: currentEmpId });
      if (candidate?.role === roleStep.role) {
        foundEmp = candidate;
      }
    }

    // Fallback by role/department
    if (!foundEmp) {
      const query = { role: roleStep.role };
      if (roleStep.department) {
        query.department = roleStep.department;
      }
      foundEmp = await User.findOne(query);
    }

    if (!foundEmp) break;

    const statusEntry = approvalStatus.find(
      (s) => s.empNo === foundEmp.empNo && s.role === roleStep.role
    );

    const baseEntry = {
      role: roleStep.role,
      empNo: foundEmp.empNo,
      name: `${foundEmp.firstName} ${foundEmp.lastName} - [${foundEmp.empNo}]`,
      approveBy: foundEmp.empNo,
      comments: statusEntry?.comments || null,
      actionDate: statusEntry?.actionDate || null,
    };

    if (!pendingEncountered) {
      if (statusEntry?.status === "Approved" || statusEntry?.status === "Submitted") {
        result.push({ ...baseEntry, status: statusEntry.status });
      } else if (statusEntry?.status === "Rejected") {
        result.push({ ...baseEntry, status: "Rejected" });
        break;
      } else {
        result.push({ ...baseEntry, status: "Pending" });
        pendingEncountered = true;
      }
    }
  }

  return result;
};




 const extractEmpNo = (reportedBy) => {
  return reportedBy.match(/\[(.*?)\]/)?.[1] || null;
};

 const generateEmpNo = async (User) => {
  const lastEmp = await User.findOne().sort({ empNo: -1 }).collation({ locale: "en_US", numericOrdering: true });
  if (lastEmp && lastEmp.empNo) {
    const lastNumber = parseInt(lastEmp.empNo.replace("EMP", ""));
    return `EMP${String(lastNumber + 1).padStart(3, "0")}`;
  }
  return "EMP001";
};


export { getApprovalStepEmployees, extractEmpNo, generateEmpNo }