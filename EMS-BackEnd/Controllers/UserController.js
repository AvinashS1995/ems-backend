import {
  EmployeeWish,
  Type,
  User,
  UserReporting,
} from "../Models/UserModel.js";
import bcrypt from "bcrypt";
import { getPresignedUrl } from "../storage/s3.config.js";
import {
  extractEmpNo,
  generateBankAccNo,
  generateEmpNo,
  generatePAN,
  generatePFNo,
  generateUAN,
} from "../common/employee.utilis.js";
import { EmployeeAnnuallySalaryBreakup } from "../Models/payrollModel.js";
import { calculateSalaryBreakup } from "../common/salaryBreakup.js";
import { offerLetterTemplate } from "../common/offerLetterTemplate.js";
import puppeteer from "puppeteer";
import { imageToBase64 } from "../common/imageToBase64.js";
import path from "path";
import { sendMailForEmployeeOfferLetter } from "../mail/sendMailforOfferLetter.js";
import { formatDate } from "../common/dateFormat.js";
import { ROLE_ID } from "../common/constant.js";

const companyLogo = imageToBase64(path.join("assets", "company-logo.png"));

const company = {
  name: "EMS AS IT Technologies Ltd",
  address: "Powai Mumbai, Maharashtra 400001 India",
  logo: companyLogo,
};

const CreateUser = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      email,
      address,
      country,
      department,
      role,
      mobile,
      status,
      type,
      reportedBy,
      designation,
      joiningDate,
      salary,
      workType,
      profileImage,
    } = req.body;

    if (
      !email ||
      !role ||
      !status ||
      !type ||
      !designation ||
      !joiningDate ||
      !salary ||
      !workType
    ) {
      return res.status(400).json({
        status: "fail",
        message: "All fields are required",
      });
    }

    // ✅ Check if role is valid
    if (!ROLE_ID[role]) {
      return res.status(400).json({
        status: "fail",
        message: `Invalid role: ${role}`,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "User already exists",
      });
    }

    const empNo = await generateEmpNo(User);

    const password = "Admin@1234";
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      empNo,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      email,
      address,
      country,
      password: hashPassword,
      role,
      roleId: ROLE_ID[role],
      mobile,
      status,
      type,
      reportedBy,
      designation,
      department,
      joiningDate,
      salary,
      workType,
      // 🔹 Auto-generate Bank Details
      bankName: "ICICI BANK",
      bankAccNo: generateBankAccNo(),
      pfNo: generatePFNo(),
      uan: generateUAN(),
      pan: generatePAN(),
    });

    await newUser.save();

    // Save to ReportedEmployee
    const reportedByEmpID = extractEmpNo(reportedBy); // EMP0056

    if (reportedByEmpID) {
      await UserReporting.create({
        employee: empNo,
        reportedByEmployee: reportedByEmpID,
      });
    }

    // Auto-generate salary breakup
    if (newUser.salary) {
      const breakup = calculateSalaryBreakup(newUser.salary);

      await EmployeeAnnuallySalaryBreakup.create({
        empNo: newUser.empNo,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        annualCTC: newUser.salary,
        components: {
          monthly: breakup.monthly,
          yearly: breakup.yearly,
        },
      });
    }

    const ctcBreakup = await EmployeeAnnuallySalaryBreakup.findOne({
      empNo: newUser.empNo,
    });

    // Generate Offer Letter HTML
    const html = offerLetterTemplate({
      issueDate: new Date().toLocaleDateString("en-GB"),
      joiningDate: formatDate(newUser.joiningDate),
      employee: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        employeeId: newUser.empNo,
        designation: newUser.designation,
        department: newUser.department,
        location: newUser.country || "India",
        address: newUser.address,
      },
      salary: {
        ctc: ctcBreakup.annualCTC,
        monthly: ctcBreakup.components.monthly,
        yearly: ctcBreakup.components.yearly,
        probation: "6 Months",
      },
      policy: {
        workHours: "9:30 AM - 6:30 PM, Monday to Friday",
        noticePeriodProbation: "30 days",
        noticePeriodConfirmed: "90 days",
        leaveBreakup: "Casual: 7 | Sick: 7 | Paid: 15",
      },
    });
    console.log(ctcBreakup);
    // Convert to PDF
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "3mm", bottom: "3mm", left: "1mm", right: "1mm" },
    });
    await browser.close();

    // Send Email with PDF
    sendMailForEmployeeOfferLetter(company, newUser, pdfBuffer);

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        empNo: empNo,
        employeeId: newUser._id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// const GetUserList = async (req, res) => {
//   try {
//     console.log("=================================");
//     console.log("REQ.USER:", req.user);
//     console.log("REQ.USER EMAIL:", req.email);
//     console.log("REQ.USER ID:", req.user?._id);
//     console.log("=================================");

//     const { name, role, status, type } = req.body;

//     // const query = entityValue ? { entityValue } : {};

//     const query = {};

//     // --------------------------------
//     // 1. NEVER SHOW ADMIN
//     // --------------------------------
//     query.roleId = { $ne: 1 };

//     // --------------------------------
//     // 2. NEVER SHOW LOGGED-IN USER
//     // --------------------------------
//     if (req.user?.email) {
//       query.email = { $ne: req.user.email };
//     }

//     if (role) {
//       query.role = role;
//     }

//     if (status) {
//       query.status = status;
//     }

//     if (type) {
//       query.type = type;
//     }

//     if (name) {
//       query.name = { $regex: "^" + name, $options: "i" };
//     }

//     const page = parseInt(req.body.page) || 1;
//     const limit = parseInt(req.body.limit) || 10;
//     const skip = (page - 1) * limit;

//     const total = await User.countDocuments();
//     // const data = await User.find().skip(skip).limit(limit);

//     const users = await User.find(query).skip(skip).limit(limit);

//     const userList = await Promise.all(
//       users.map(async (user) => {
//         if (user.profileImage) {
//           const fileKey = user.profileImage; // stored fileKey
//           const presignedUrl = await getPresignedUrl(fileKey, 3600);
//           user.profileImage = presignedUrl;
//         } else {
//           user.profileImage = null;
//         }
//         return user;
//       }),
//     );

//     res.status(200).json({
//       status: "success",
//       message: "Record(s) Fetched Successfully..!",
//       data: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalRecords: total,
//         userList,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: "fail",
//       error: err.message,
//     });
//   }
// };

const GetUserList = async (req, res) => {
  try {
    const { empNo, name, role, status, type } = req.body;

    // ==========================================
    // 1. Logged-in Employee Number
    // ==========================================

    const loggedInEmpNo = empNo;

    if (!loggedInEmpNo) {
      return res.status(401).json({
        status: "fail",
        message: "Logged-in employee number not found",
      });
    }

    console.log("Logged-in Employee:", loggedInEmpNo);

    // ==========================================
    // Find ALL descendants recursively
    // ==========================================

    const hierarchy = await UserReporting.aggregate([
      {
        $match: {
          employee: loggedInEmpNo,
        },
      },

      {
        $graphLookup: {
          from: "userreportings",

          startWith: "$employee",

          connectFromField: "employee",

          connectToField: "reportedByEmployee",

          as: "allSubordinates",
        },
      },
    ]);

    // ==========================================
    // Get employee numbers
    // ==========================================

    let employeeNos = [];

    if (hierarchy.length > 0) {
      employeeNos = hierarchy[0].allSubordinates
        .filter((item) => item.employee !== loggedInEmpNo)
        .sort((a, b) => {
          // First hierarchy level
          if (a.level !== b.level) {
            return a.level - b.level;
          }

          // Within same level: first created first
          return new Date(a.createdAt) - new Date(b.createdAt);
        })
        .map((item) => item.employee);
    }

    // Remove duplicate employee numbers
    employeeNos = [...new Set(employeeNos)];

    console.log("All Employees Under:", loggedInEmpNo, employeeNos);

    // ==========================================
    // 3. If no employees
    // ==========================================

    if (employeeNos.length === 0) {
      return res.status(200).json({
        status: "success",

        message: "No employees found under logged-in user",

        data: {
          currentPage: 1,

          totalPages: 0,

          totalRecords: 0,

          userList: [],
        },
      });
    }

    // ==========================================
    // 4. Build User Query
    // ==========================================

    const query = {
      // Only employees under logged-in user
      empNo: {
        $in: employeeNos,
      },

      // Never show Admin
      roleId: {
        $ne: 1,
      },
    };

    // ==========================================
    // 5. Other filters
    // ==========================================

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (name) {
      query.name = {
        $regex: "^" + name,
        $options: "i",
      };
    }

    console.log("Final User Query:", query);

    // ==========================================
    // 6. Pagination
    // ==========================================

    const page = parseInt(req.body.page) || 1;

    const limit = parseInt(req.body.limit) || 10;

    const skip = (page - 1) * limit;

    // ==========================================
    // 7. Total records
    // ==========================================

    const total = await User.countDocuments(query);

    // ==========================================
    // 8. Get Users
    // ==========================================

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({
        createAt: -1,
      })
      .lean();

    // ==========================================
    // 9. Profile Images
    // ==========================================

    const userList = await Promise.all(
      users.map(async (user) => {
        if (user.profileImage) {
          user.profileImage = await getPresignedUrl(user.profileImage, 3600);
        } else {
          user.profileImage = null;
        }

        return user;
      }),
    );

    // ==========================================
    // 10. Response
    // ==========================================

    return res.status(200).json({
      status: "success",

      message: "Record(s) Fetched Successfully..!",

      data: {
        currentPage: page,

        totalPages: Math.ceil(total / limit),

        totalRecords: total,

        userList,
      },
    });
  } catch (err) {
    console.error("GetUserList Error:", err);

    return res.status(500).json({
      status: "fail",

      error: err.message,
    });
  }
};

const UpdateEmployeeList = async (req, res) => {
  try {
    const {
      id,
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      address,
      country,
      email,
      mobile,
      role,
      status,
      type,
      reportedBy,
      designation,
      department,
      joiningDate,
      salary,
      workType,
      profileImage,
    } = req.body;

    const existingType = await User.findById(id);
    // console.log(existingType);

    if (!existingType) {
      return res.status(404).json({
        status: "fail",
        message: "Employee not found",
      });
    }

    existingType.firstName = firstName;
    existingType.middleName = middleName;
    existingType.lastName = lastName;
    existingType.dob = dob;
    existingType.gender = gender;
    existingType.address = address;
    existingType.country = country;
    existingType.email = email;
    existingType.mobile = mobile;
    existingType.role = role;
    existingType.roleId = ROLE_ID[role];
    existingType.status = status;
    existingType.reportedBy = reportedBy;
    existingType.designation = designation;
    existingType.department = department;
    existingType.joiningDate = joiningDate;
    existingType.salary = salary;
    existingType.workType = workType;
    existingType.profileImage = profileImage;
    // 🔹 Auto-generate Bank Details
    // (existingType.bankName = "ICICI BANK"),
    //   (existingType.bankAccNo = generateBankAccNo()),
    //   (existingType.pfNo = generatePFNo()),
    //   (existingType.uan = generateUAN()),
    //   (existingType.pan = generatePAN()),

    // Update UserReporting if `reportedBy` changed
    if (reportedBy !== existingType.reportedBy) {
      const empNo = existingType.empNo;
      const newReportedByEmpID = extractEmpNo(reportedBy);
      await UserReporting.findOneAndUpdate(
        { employee: empNo },
        { reportedByEmployee: newReportedByEmpID },
        { upsert: true },
      );
    }

    if (salary) {
      const breakup = calculateSalaryBreakup(salary);

      console.log("Breakup---->", breakup);

      await EmployeeAnnuallySalaryBreakup.findOneAndUpdate(
        { empNo: existingType.empNo },
        {
          empNo: existingType.empNo,
          firstName: existingType.firstName,
          lastName: existingType.lastName,
          annualCTC: existingType.salary,
          components: {
            monthly: breakup.monthly,
            yearly: breakup.yearly,
          },
        },
        { new: true, upsert: true }, // return updated doc, create if not exists
      );

      const ctcBreakup = await EmployeeAnnuallySalaryBreakup.findOne({
        empNo: existingType.empNo,
      });

      // console.log(ctcBreakup);
      // Generate Offer Letter HTML
      const html = offerLetterTemplate({
        issueDate: new Date().toLocaleDateString("en-GB"),
        joiningDate: formatDate(existingType.joiningDate),
        employee: {
          firstName: existingType.firstName,
          lastName: existingType.lastName,
          employeeId: existingType.empNo,
          designation: existingType.designation,
          department: existingType.department,
          location: existingType.country || "India",
          address: existingType.address,
        },
        salary: {
          ctc: ctcBreakup.annualCTC,
          monthly: ctcBreakup.components.monthly,
          yearly: ctcBreakup.components.yearly,
          probation: "6 Months",
        },
        policy: {
          workHours: "9:30 AM - 6:30 PM, Monday to Friday",
          noticePeriodProbation: "30 days",
          noticePeriodConfirmed: "90 days",
          leaveBreakup: "Casual: 7 | Sick: 7 | Paid: 15",
        },
      });

      console.log(ctcBreakup);

      // Convert to PDF
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "3mm", bottom: "3mm", left: "1mm", right: "1mm" },
      });
      await browser.close();

      sendMailForEmployeeOfferLetter(company, existingType, pdfBuffer);
    }
    await existingType.save();

    // Update UserReporting if `reportedBy` changed
    if (reportedBy !== existingType.reportedBy) {
      const empNo = existingType.empNo;
      const newReportedByEmpID = extractEmpNo(reportedBy);
      await UserReporting.findOneAndUpdate(
        { employee: empNo },
        { reportedByEmployee: newReportedByEmpID },
        { upsert: true },
      );
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Updated Successfully!",
      data: {
        existingType,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const DeleteEmployeeList = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Employee not found!",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Deleted Successfully..!",
      data: {
        deleted,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      error: err.message,
    });
  }
};

const CreateTypeList = async (req, res) => {
  try {
    const { entityValue, typeLabel, departmentType, description } = req.body;

    const labelExists = await Type.findOne({ typeLabel });

    if (labelExists) {
      return res.status(400).json({
        status: "fail",
        message: "Type label already exists",
      });
    }

    // Find max typeValue for this entityValue
    const lastType = await Type.findOne({ entityValue }).sort({
      typeValue: -1,
    });
    const newTypeValue = lastType ? lastType.typeValue + 1 : 1;

    const type = new Type({
      entityValue,
      typeLabel,
      typeValue: newTypeValue,
      departmentType,
      description,
    });

    await type.save();

    res.status(201).json({
      status: "success",
      message: "Successfully Created!",
      data: {
        entityValue: type.entityValue,
        typeLabel: type.typeLabel,
        typeValue: type.typeValue,
        description: type.description,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const GetTypeList = async (req, res) => {
  try {
    const { entityValue, typeLabel, departmentType } = req.body;

    const query = {};

    if (entityValue) {
      query.entityValue = entityValue;
    }

    if (typeLabel) {
      query.typeLabel = typeLabel;
    }

    if (departmentType) {
      query.typeLabel = departmentType;
    }

    const types = await Type.find(query).select(
      "_id entityValue typeLabel typeValue departmentType description",
    );

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully..!",
      data: {
        types,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      error: err.message,
    });
  }
};

const UpdateTypeList = async (req, res) => {
  try {
    const { id, entityValue, typeLabel, departmentType, description } =
      req.body;

    const existingType = await Type.findById(id);
    // console.log(existingType);

    if (!existingType) {
      return res.status(404).json({
        status: "fail",
        message: "Type not found",
      });
    }

    existingType.entityValue = entityValue;
    existingType.typeLabel = typeLabel;
    existingType.departmentType = departmentType;
    existingType.description = description;
    existingType.updateAt = new Date();

    await existingType.save();

    res.status(200).json({
      status: "success",
      message: "Record(s) Updated Successfully!",
      data: {
        entityValue: existingType.entityValue,
        typeLabel: existingType.typeLabel,
        typeValue: existingType.typeValue,
        description: existingType.description,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const DeleteTypeList = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await Type.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: "fail",
        message: "Type not found!",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Record(s) Deleted Successfully..!",
      data: {
        entityValue: deleted.entityValue,
        typeLabel: deleted.typeLabel,
        typeValue: deleted.typeValue,
        description: deleted.description,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      error: err.message,
    });
  }
};

const getManagerWiseTeamLeaders = async (req, res) => {
  try {
    const { empNo } = req.body;

    // Find team leaders under this Manager
    const reportingRecords = await UserReporting.find({
      reportedByEmployee: empNo,
    });

    if (!reportingRecords.length) {
      return res.status(404).json({
        status: "fail",
        message: "No Team Leaders found under this Manager",
      });
    }

    const teamLeaderEmpNos = reportingRecords.map((r) => r.employee);
    const teamLeaders = await User.find({
      empNo: { $in: teamLeaderEmpNos },
      role: "Team Leader",
    });

    // 🔹 Only return required fields
    const formattedLeaders = teamLeaders.map((tl) => ({
      empNo: tl.empNo,
      name: `${tl.firstName} ${tl.lastName}`,
      email: tl.email,
      role: tl.role,
      designation: tl.designation,
    }));

    res.status(200).json({
      status: "success",
      message: "Team Leaders fetched successfully",
      data: {
        formattedLeaders,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getTeamLeaderWiseEmployees = async (req, res) => {
  try {
    const { empNo } = req.body;

    // Find employees under this Team Leader
    const reportingRecords = await UserReporting.find({
      reportedByEmployee: empNo,
    });

    if (!reportingRecords.length) {
      return res.status(404).json({
        status: "fail",
        message: "No Employees found under this Team Leader",
      });
    }

    // Get User details for those employees
    const employeeEmpNos = reportingRecords.map((r) => r.employee);
    const employees = await User.find({
      empNo: { $in: employeeEmpNos },
      role: "Employee",
    });

    // 🔹 Only return required fields
    const formattedEmployees = employees.map((e) => ({
      empNo: e.empNo,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      role: e.role,
      designation: e.designation,
    }));

    res.status(200).json({
      status: "success",
      message: "Employees fetched successfully",
      data: {
        formattedEmployees,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getManagerWiseTeamLeaderWithEmployees = async (req, res) => {
  try {
    const { empNo } = req.body;

    const tlReportingRecords = await UserReporting.find({
      reportedByEmployee: empNo,
    });

    console.log(tlReportingRecords);

    if (!tlReportingRecords.length) {
      return res.status(404).json({
        status: "fail",
        message: "No Team Leaders found under this Manager",
      });
    }

    const teamLeaderEmpNos = tlReportingRecords.map((r) => r.employee);

    const teamLeaders = await User.find({
      empNo: { $in: teamLeaderEmpNos },
      role: "Team Leader",
    });

    const result = await Promise.all(
      teamLeaders.map(async (tl) => {
        const empReporting = await UserReporting.find({
          reportedByEmployee: tl.empNo,
        });

        const empNos = empReporting.map((r) => r.employee);
        const employees = await User.find({
          empNo: { $in: empNos },
          role: "Employee",
        });

        return {
          teamLeader: {
            empNo: tl.empNo,
            name: `${tl.firstName} ${tl.lastName}`,
            email: tl.email,
            role: tl.role,
            designation: tl.designation,
          },
          employees: employees.map((e) => ({
            empNo: e.empNo,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
            role: e.role,
            designation: e.designation,
          })),
        };
      }),
    );

    res.status(200).json({
      status: "success",
      data: {
        manager: empNo,
        teamLeaders: result,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const GetTodayPeopleMoments = async (req, res) => {
  try {
    // =========================================================
    // TODAY
    // =========================================================

    const today = new Date();

    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    // =========================================================
    // GET ACTIVE EMPLOYEES
    // =========================================================

    const users = await User.find({
      roleId: { $ne: 1 }, // Never show Admin
      status: { $regex: /^active$/i },
    })
      .select(
        "empNo firstName lastName dob joiningDate designation department profileImage role roleId status",
      )
      .lean();

    // =========================================================
    // RESULT
    // =========================================================

    const birthdays = [];
    const anniversaries = [];
    const newJoinees = [];

    // =========================================================
    // DATE PARSER
    // =========================================================

    const parseDate = (value) => {
      if (!value) {
        return null;
      }

      const date = new Date(value);

      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    };

    // =========================================================
    // EMPLOYEE FORMATTER
    // =========================================================

    const formatEmployee = async (user) => {
      let profileImage = null;

      if (user.profileImage) {
        try {
          profileImage = await getPresignedUrl(user.profileImage, 3600);
        } catch (error) {
          console.error(
            `Profile image error for ${user.empNo}:`,
            error.message,
          );
        }
      }

      return {
        empNo: user.empNo,

        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),

        image: profileImage,

        designation: user.designation || "",

        department: user.department || "",
      };
    };

    // =========================================================
    // PROCESS USERS
    // =========================================================

    for (const user of users) {
      // -------------------------------------------------------
      // BIRTHDAY
      // -------------------------------------------------------

      const dob = parseDate(user.dob);

      if (dob) {
        const dobMonth = dob.getMonth() + 1;

        const dobDay = dob.getDate();

        if (dobMonth === currentMonth && dobDay === currentDay) {
          birthdays.push(await formatEmployee(user));
        }
      }

      // -------------------------------------------------------
      // JOINING DATE
      // -------------------------------------------------------

      const joiningDate = parseDate(user.joiningDate);

      if (joiningDate) {
        const joiningMonth = joiningDate.getMonth() + 1;

        const joiningDay = joiningDate.getDate();

        const joiningYear = joiningDate.getFullYear();

        // -----------------------------------------------------
        // WORK ANNIVERSARY
        // -----------------------------------------------------

        if (
          joiningMonth === currentMonth &&
          joiningDay === currentDay &&
          joiningYear < currentYear
        ) {
          anniversaries.push({
            ...(await formatEmployee(user)),
            yearsCompleted: currentYear - joiningYear,
          });
        }

        // -----------------------------------------------------
        // NEW JOINEE
        // -----------------------------------------------------

        if (
          joiningMonth === currentMonth &&
          joiningDay === currentDay &&
          joiningYear === currentYear
        ) {
          newJoinees.push(await formatEmployee(user));
        }
      }
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    const total = birthdays.length + anniversaries.length + newJoinees.length;

    return res.status(200).json({
      status: "success",

      message: "Today's people moments fetched successfully",

      data: {
        birthdays,

        anniversaries,

        newJoinees,

        summary: {
          birthdays: birthdays.length,

          anniversaries: anniversaries.length,

          newJoinees: newJoinees.length,

          total,
        },
      },
    });
  } catch (error) {
    console.error("GetTodayPeopleMoments Error:", error);

    return res.status(500).json({
      status: "fail",

      message: error.message,
    });
  }
};

const SendEmployeeWish = async (req, res) => {
  try {
    const { recipientEmpNo, occasionType, message } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!recipientEmpNo || !occasionType || !message?.trim()) {
      return res.status(400).json({
        status: "fail",
        message: "Recipient, occasion and message are required",
      });
    }

    if (!["birthday", "anniversary", "newJoinee"].includes(occasionType)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid occasion type",
      });
    }

    // ==========================================
    // GET SENDER
    // ==========================================

    const senderEmpNo = req.user?.empNo || req.body.senderEmpNo;

    if (!senderEmpNo) {
      return res.status(401).json({
        status: "fail",
        message: "Logged-in employee not found",
      });
    }

    const sender = await User.findOne({
      empNo: senderEmpNo,
    });

    if (!sender) {
      return res.status(404).json({
        status: "fail",
        message: "Sender employee not found",
      });
    }

    // ==========================================
    // GET RECIPIENT
    // ==========================================

    const recipient = await User.findOne({
      empNo: recipientEmpNo,
    });

    if (!recipient) {
      return res.status(404).json({
        status: "fail",
        message: "Recipient employee not found",
      });
    }

    // ==========================================
    // CREATE WISH
    // ==========================================

    const wish = await EmployeeWish.create({
      recipientEmpNo: recipient.empNo,

      recipientName: `${recipient.firstName} ${recipient.lastName}`.trim(),

      senderEmpNo: sender.empNo,

      senderName: `${sender.firstName} ${sender.lastName}`.trim(),

      senderDesignation: sender.designation || "",

      senderDepartment: sender.department || "",

      senderProfileImage: sender.profileImage || null,

      occasionType,

      message: message.trim(),
    });

    return res.status(201).json({
      status: "success",
      message: "Wish sent successfully",
      data: {
        wish,
      },
    });
  } catch (error) {
    console.error("SendEmployeeWish Error:", error);

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

const GetEmployeeWishes = async (req, res) => {
  try {
    const { EmpNo, occasionType } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!EmpNo) {
      return res.status(400).json({
        status: "fail",
        message: "Login employee number is required",
      });
    }

    // ==========================================
    // VALIDATE OCCASION
    // ==========================================

    if (
      occasionType &&
      !["birthday", "anniversary", "newJoinee"].includes(occasionType)
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid occasion type",
      });
    }

    // ==========================================
    // BUILD QUERY
    // ==========================================

    const query = {
      recipientEmpNo: EmpNo,
    };

    if (occasionType) {
      query.occasionType = occasionType;
    }

    console.log("Get Wishes Query:", query);

    // ==========================================
    // GET WISHES
    // ==========================================

    const wishes = await EmployeeWish.find(query)
      .sort({
        createdAt: -1,
      })
      .lean();

    // ==========================================
    // FORMAT PROFILE IMAGE
    // ==========================================

    const formattedWishes = await Promise.all(
      wishes.map(async (wish) => {
        let profileImage = null;

        if (wish.senderProfileImage) {
          try {
            profileImage = await getPresignedUrl(wish.senderProfileImage, 3600);
          } catch (error) {
            console.error(
              `Wish profile image error for ${wish.senderEmpNo}:`,
              error.message,
            );
          }
        }

        return {
          _id: wish._id,
          senderEmpNo: wish.senderEmpNo,
          senderName: wish.senderName,
          senderDesignation: wish.senderDesignation,
          senderDepartment: wish.senderDepartment,
          senderProfileImage: profileImage,
          message: wish.message,
          occasionType: wish.occasionType,
          createdAt: wish.createdAt,
        };
      }),
    );

    return res.status(200).json({
      status: "success",
      message: "Wishes fetched successfully",

      data: {
        totalRecords: formattedWishes.length,
        wishes: formattedWishes,
      },
    });
  } catch (error) {
    console.error("GetEmployeeWishes Error:", error);

    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

export {
  CreateUser,
  GetUserList,
  UpdateEmployeeList,
  DeleteEmployeeList,
  CreateTypeList,
  GetTypeList,
  UpdateTypeList,
  DeleteTypeList,
  getManagerWiseTeamLeaders,
  getTeamLeaderWiseEmployees,
  getManagerWiseTeamLeaderWithEmployees,
  GetTodayPeopleMoments,
  SendEmployeeWish,
  GetEmployeeWishes,
};
