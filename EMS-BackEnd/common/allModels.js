import { Type, User, UserReporting } from "../Models/UserModel.js";
import UploadFileToken from "../Models/uploadFileModel.js";
import { Popup } from "../Models/popupModel.js";
import {
  EmployeeAnnuallySalaryBreakup,
  Payslip,
} from "../Models/payrollModel.js";
import OTP from "../Models/otpModel.js";
import { Menu, RoleMenu } from "../Models/menuModel.js";
import { EmployeeUrlMeeting, Meeting } from "../Models/meetingModel.js";
import { Holidays } from "../Models/holidayModel.js";
import File from "../Models/fileModel.js";
import { ApprovalFlow } from "../Models/approvalModel.js";
import { Leave, LeaveBalance } from "../Models/leaveModel.js";
import { Projects } from "../Models/projectTaskModel.js";
import Attendance from "../Models/attendenceModel.js";

const modelMap = {
  User,
  UserReporting,
  Type,
  UploadFileToken,
  Popup,
  Payslip,
  EmployeeAnnuallySalaryBreakup,
  OTP,
  Menu,
  RoleMenu,
  Meeting,
  EmployeeUrlMeeting,
  Projects,
  Leave,
  LeaveBalance,
  Holidays,
  File,
  ApprovalFlow,
  Attendance,
};

export default modelMap;
