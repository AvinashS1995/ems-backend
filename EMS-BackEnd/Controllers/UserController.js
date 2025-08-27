import { Type, User, UserReporting } from "../Models/UserModel.js";
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
      joiningDate: newUser.joiningDate,
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
    sendMailForEmployeeOfferLetter(company, existingType, pdfBuffer);

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

const GetUserList = async (req, res) => {
  try {
    const { name, role, status, type } = req.body;

    // const query = entityValue ? { entityValue } : {};

    const query = {};

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
      query.name = { $regex: "^" + name, $options: "i" };
    }

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    // const data = await User.find().skip(skip).limit(limit);

    const users = await User.find(query).skip(skip).limit(limit);

    const userList = await Promise.all(
      users.map(async (user) => {
        if (user.profileImage) {
          const fileKey = user.profileImage; // stored fileKey
          const presignedUrl = await getPresignedUrl(fileKey, 3600);
          user.profileImage = presignedUrl;
        } else {
          user.profileImage = null;
        }
        return user;
      })
    );

    res.status(200).json({
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
    res.status(500).json({
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
    existingType.status = status;
    existingType.reportedBy = reportedBy;
    existingType.designation = designation;
    existingType.department = department;
    existingType.joiningDate = joiningDate;
    existingType.salary = salary;
    existingType.workType = workType;
    existingType.profileImage = profileImage;
    // 🔹 Auto-generate Bank Details
    (existingType.bankName = "ICICI BANK"),
      (existingType.bankAccNo = generateBankAccNo()),
      (existingType.pfNo = generatePFNo()),
      (existingType.uan = generateUAN()),
      (existingType.pan = generatePAN()),
      // if (salary) {
      //   const breakup = calculateSalaryBreakup(salary);

      //   console.log("Breakup---->", breakup);

      //   await EmployeeAnnuallySalaryBreakup.create({
      //     empNo: existingType.empNo,
      //     firstName: existingType.firstName,
      //     lastName: existingType.lastName,
      //     annualCTC: existingType.salary,
      //     components: {
      //       monthly: breakup.monthly,
      //       yearly: breakup.yearly,
      //     },
      //   });

      //   const ctcBreakup = await EmployeeAnnuallySalaryBreakup.findOne({
      //     empNo: existingType.empNo,
      //   });

      //   // console.log(ctcBreakup);
      //   // Generate Offer Letter HTML
      //   const html = offerLetterTemplate({
      //     issueDate: new Date().toLocaleDateString("en-GB"),
      //     joiningDate: formatDate(existingType.joiningDate),
      //     employee: {
      //       firstName: existingType.firstName,
      //       lastName: existingType.lastName,
      //       employeeId: existingType.empNo,
      //       designation: existingType.designation,
      //       department: existingType.department,
      //       location: existingType.country || "India",
      //       address: existingType.address,
      //     },
      //     salary: {
      //       ctc: ctcBreakup.annualCTC,
      //       monthly: ctcBreakup.components.monthly,
      //       yearly: ctcBreakup.components.yearly,
      //       probation: "6 Months",
      //     },
      //     policy: {
      //       workHours: "9:30 AM - 6:30 PM, Monday to Friday",
      //       noticePeriodProbation: "30 days",
      //       noticePeriodConfirmed: "90 days",
      //       leaveBreakup: "Casual: 7 | Sick: 7 | Paid: 15",
      //     },
      //   });

      //   console.log(ctcBreakup);

      //   // Convert to PDF
      //   const browser = await puppeteer.launch({ headless: "new" });
      //   const page = await browser.newPage();
      //   await page.setContent(html, { waitUntil: "networkidle0" });
      //   const pdfBuffer = await page.pdf({
      //     format: "A4",
      //     printBackground: true,
      //     margin: { top: "3mm", bottom: "3mm", left: "1mm", right: "1mm" },
      //   });
      //   await browser.close();

      //   sendMailForEmployeeOfferLetter(company, existingType, pdfBuffer);
      // }
      await existingType.save();

    // Update UserReporting if `reportedBy` changed
    if (reportedBy !== existingType.reportedBy) {
      const empNo = existingType.empNo;
      const newReportedByEmpID = extractEmpNo(reportedBy);
      await UserReporting.findOneAndUpdate(
        { employee: empNo },
        { reportedByEmployee: newReportedByEmpID },
        { upsert: true }
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
      "_id entityValue typeLabel typeValue departmentType description"
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

export {
  CreateUser,
  GetUserList,
  UpdateEmployeeList,
  DeleteEmployeeList,
  CreateTypeList,
  GetTypeList,
  UpdateTypeList,
  DeleteTypeList,
};
