import { User } from "../Models/UserModel.js";
import Attendance from "../Models/attendenceModel.js";
import OTP from "../Models/otpModel.js";
import transporter from "../mail/transporter.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config({ path: "./.env" });

const OFFICE_START = moment("08:30", "HH:mm");
const LATE_LIMIT = moment("10:30", "HH:mm");
const OFFICE_HOURS = 9;

// Send OTP API Method
const sendCheckInsOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otpCode, salt);

    // Set OTP expiry (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in DB
    await OTP.create({ email, otp: hashedOtp, expiresAt });
    // console.log(process.env);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Attendence Check Ins for Email OTP Authetication",
      html: `
    <div style="max-width: 500px; margin: auto; padding: 20px; font-family: Arial, sans-serif; 
                border: 1px solid #ddd; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #4285F4; text-align: center;">Email OTP</h2>
        <hr style="border: 1px solid #ddd;">
        <p style="font-size: 16px; text-align: center;">Dear User,</p>
        <p style="font-size: 16px; text-align: center;">Your Attendence Check Ins One-Time Password (OTP) is:</p>
        <h1 style="color: #4CAF50; text-align: center; font-size: 36px;">${otpCode}</h1>
        <p style="font-size: 14px; text-align: center;">Please use this OTP to complete your Attendence Check Ins. It is valid for 5 minutes.
            Do not share this code with anyone.</p>
        <p style="font-size: 14px; text-align: center;">Thank you for using Email OTP!</p>
        <hr style="border: 1px solid #ddd;">
        <p style="text-align: center; font-size: 12px; color: #888;">© <a href="https://www.yourwebsite.com" 
                style="color: #4285F4; text-decoration: none;">employeemanagementsystem.com</a>. All rights reserved.</p>
    </div>
  `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          status: "fail",
          message: err.message,
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Check Ins OTP Successfully send on your Registered Email.",
      });
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// const verifyCheckInsOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const existingOtp = await OTP.findOne({ email }).sort({ expiresAt: -1 });
//     if (!existingOtp) {
//       return res.status(400).json({
//         status: 'fail',
//         message: "OTP not found. Please request a new one."
//       });
//     }

//     const isOtpValid = await bcrypt.compare(otp, existingOtp.otp);
//     if (!isOtpValid) {
//       // console.log(res);

//       return res.status(400).json({
//         status: 'fail',
//         message: "Invalid OTP."
//       });
//     }

//     if (existingOtp.expiresAt < new Date()) {
//       return res.status(400).json({
//         status: 'fail',
//         message: "OTP has expired."
//       });
//     }

//     // Delete OTP after verification
//     // await OTP.deleteMany({ email });

//     // 2. Get user details
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         status: 'fail',
//         message: "User not found."
//       });
//     }

//     const { name, designation, workType } = user;

//     const checkInTime = moment(); // current time

//     let status = "Present";
//     if (checkInTime.isAfter(LATE_LIMIT)) {
//       status = "Late";
//     }

//     // Check if already checked in
//     const existing = await Attendance.findOne({
//       email,
//       date: checkInTime.format("YYYY-MM-DD"),
//     });

//     if (existing) {
//       return res.status(400).json({
//         status: 'fail',
//         message: "Already checked in today."
//       });
//     }

//     // 4. Save attendance
//     const attendance = new Attendance({
//       email,
//       name,
//       designation,
//       employmentType: workType, // WFH or WFO
//       date: checkInTime.format("YYYY-MM-DD"),
//       checkInTime: checkInTime.toDate(),
//       status,
//     });

//     await attendance.save();

//     return res.status(200).json({
//       status: 'fail',
//       message: `Check-in successful. Status: ${status}.`,
//       checkInTime: checkInTime.format("HH:mm:ss"),
//       status,
//     });
//   } catch (err) {
//     return res.status(500).json({
//         status: 'fail',
//         message: "Something went wrong",
//         error: err.message
//       });
//   }
// };

const verifyCheckInsOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // OTP verification logic remains unchanged ...

    const existingOtp = await OTP.findOne({ email }).sort({ expiresAt: -1 });
    if (!existingOtp) {
      return res.status(400).json({
        status: "fail",
        message: "OTP not found. Please request a new one.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, existingOtp.otp);
    if (!isOtpValid) {
      // console.log(res);

      return res.status(400).json({
        status: "fail",
        message: "Invalid OTP.",
      });
    }

    if (existingOtp.expiresAt < new Date()) {
      return res.status(400).json({
        status: "fail",
        message: "OTP has expired.",
      });
    }

    // Delete OTP after verification
    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found." });

    const today = moment().format("YYYY-MM-DD");
    let attendance = await Attendance.findOne({ email, date: today });

    const currentTime = moment();

    if (attendance) {
      const lastSession = attendance.sessions[attendance.sessions.length - 1];

      if (lastSession && !lastSession.checkOut) {
        return res.status(400).json({
          status: "fail",
          message: "Already checked in. Please check out first.",
        });
      }

      // Append new session
      attendance.sessions.push({ checkIn: currentTime.toDate() });
      attendance.checkInTime = attendance.checkInTime || currentTime.toDate(); // Keep first check-in
    } else {
      // New attendance record
      attendance = new Attendance({
        email,
        name: user.name,
        designation: user.designation,
        employmentType: user.workType,
        date: today,
        status: currentTime.isAfter(LATE_LIMIT) ? "Late" : "Present",
        checkInTime: currentTime.toDate(),
        sessions: [{ checkIn: currentTime.toDate() }],
      });
    }

    await attendance.save();

    res.status(200).json({
      status: "success",
      message: `Check-in successful.`,
      checkInTime: currentTime.format("HH:mm:ss"),
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// const checkOut = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const today = moment().format("YYYY-MM-DD");

//     // Find today's attendance entry
//     const attendance = await Attendance.findOne({ email, date: today });

//     if (!attendance) {
//       return res.status(404).json({
//         status: 'fail',
//         message: "No check-in record found for today."
//       });
//     }

//     if (attendance.checkOutTime) {
//       return res.status(400).json({
//         status: 'fail',
//         message: "Already checked out."
//       });
//     }

//     // const checkOutTime = moment();
//     // const checkInTime = moment(attendance.checkInTime);
//     // const durationHours = moment
//     //   .duration(checkOutTime.diff(checkInTime))
//     //   .asHours();

//     const checkOutTime = moment();
//     const checkInTime = moment(attendance.checkInTime);
//     const duration = moment.duration(checkOutTime.diff(checkInTime));
//     const durationHours = duration.asHours();

//     let status = attendance.status; // keep existing if late
//     if (durationHours >= 9) {
//       status = "Present";
//     } else if (durationHours >= 4.5) {
//       status = "Half day";
//     } else {
//       status = "Absent";
//     }

//     // Format total worked time as HH:mm:ss
//     const totalWorkedHours = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");

//     attendance.checkOutTime = checkOutTime.toDate();
//     attendance.status = status;
//     attendance.totalWorkedHours = totalWorkedHours;

//     await attendance.save();

//     return res.status(200).json({
//       status: 'fail',
//       message: `Check-out successful. You worked ${totalWorkedHours} hours. Status: ${status}.`,
//       checkOutTime: checkOutTime.format("HH:mm:ss"),
//       totalWorkedHours,
//       status,
//     });
//   } catch (err) {
//     return res.status(500).json({
//         status: 'fail',
//         message: "Check-out failed",
//         error: err.message
//       });
//   }
// };

// const checkOut = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const today = moment().format("YYYY-MM-DD");

//     const attendance = await Attendance.findOne({ email, date: today });
//     if (!attendance) {
//       return res.status(404).json({
//         status: "fail",
//         message: "No check-in record found for today.",
//       });
//     }

//     const sessions = attendance.sessions;
//     const lastSession = sessions[sessions.length - 1];

//     if (!lastSession || lastSession.checkOut) {
//       return res
//         .status(400)
//         .json({ status: "fail", message: "No active session to check out." });
//     }

//     const checkOutTime = moment();
//     lastSession.checkOut = checkOutTime.toDate();
//     attendance.checkOutTime = checkOutTime.toDate();

//     // Calculate total worked duration
//     let totalMs = 0;
//     sessions.forEach((s, i) => {
//       if (s.checkIn && s.checkOut) {
//         const duration = moment(s.checkOut).diff(moment(s.checkIn));
//         totalMs += duration;
//         console.log(`Session ${i + 1}: ${moment(s.checkIn).format()} - ${moment(s.checkOut).format()} = ${moment.duration(duration).humanize()}`);

//       }
//     });

//     // const duration = moment.duration(totalMs);
//     // const totalWorkedHours = moment
//     //   .utc(duration.asMilliseconds())
//     //   .format("HH:mm:ss");

//     const duration = moment.duration(totalMs);
//     const hours = Math.floor(duration.asHours());
//     const minutes = Math.floor(duration.minutes());
//     const seconds = Math.floor(duration.seconds());

//     const totalWorkedHours = `${String(hours).padStart(2, "0")}:${String(
//       minutes
//     ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

//     console.log(totalWorkedHours);

//     attendance.totalWorkedHours = totalWorkedHours;

//     // Determine final status
//     const hoursWorked = duration.asHours();
//     let status = attendance.status; // default to initial
//     if (hoursWorked >= 9) status = "Present";
//     else if (hoursWorked >= 4.5) status = "Half-day";
//     else status = "Absent";

//     attendance.status = status;

//     await attendance.save();

//     return res.status(200).json({
//       status: "success",
//       message: `Check-out successful. You worked ${totalWorkedHours}. Status: ${status}.`,
//       checkOutTime: checkOutTime.format("HH:mm:ss"),
//       totalWorkedHours,
//       status,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: "fail",
//       message: "Check-out failed",
//       error: err.message,
//     });
//   }
// };

const checkOut = async (req, res) => {
  try {
    const { email } = req.body;
    const today = moment().format("YYYY-MM-DD");

    const attendance = await Attendance.findOne({ email, date: today });
    if (!attendance) {
      return res.status(404).json({
        status: "fail",
        message: "No check-in record found for today.",
      });
    }

    const sessions = attendance.sessions;
    const lastSession = sessions[sessions.length - 1];

    if (!lastSession || lastSession.checkOut) {
      return res
        .status(400)
        .json({ status: "fail", message: "No active session to check out." });
    }

    const checkOutTime = moment();
    lastSession.checkOut = checkOutTime.toDate();
    attendance.checkOutTime = checkOutTime.toDate();

    // Calculate total worked duration (use updated sessions)
    let totalMs = 0;
    attendance.sessions.forEach((s, i) => {
      if (s.checkIn && s.checkOut) {
        const duration = moment(s.checkOut).diff(moment(s.checkIn));
        totalMs += duration;
        console.log(
          `Session ${i + 1}: ${moment(s.checkIn).format()} - ${moment(
            s.checkOut
          ).format()} = ${moment.duration(duration).humanize()}`
        );
      }
    });

    const duration = moment.duration(totalMs);
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.minutes());
    const seconds = Math.floor(duration.seconds());
    const totalWorkedHours = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    console.log(totalWorkedHours);

    attendance.totalWorkedHours = totalWorkedHours;

    // Determine final status
    const hoursWorked = duration.asHours();
    let status = attendance.status;
    if (hoursWorked >= 9) status = "Present";
    else if (hoursWorked >= 4.5) status = "Half-day";
    else status = "Absent";

    attendance.status = status;

    await attendance.save();

    return res.status(200).json({
      status: "success",
      message: `Check-out successful. You worked ${totalWorkedHours}. Status: ${status}.`,
      checkOutTime: checkOutTime.format("HH:mm:ss"),
      totalWorkedHours,
      status,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: "Check-out failed",
      error: err.message,
    });
  }
};

const workSummary = async (req, res) => {
  try {
    const { email, date } = req.body;

    if (!email || !date) {
      return res.status(400).json({
        status: "fail",
        message: "Email and date are required.",
      });
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      email,
      checkInTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ checkInTime: 1 });

    if (records.length === 0) {
      return res.json({ totalWorkSeconds: 0 });
    }

    const firstCheckIn = records[0].checkInTime;
    const lastCheckOut = records[records.length - 1].checkOutTime;

    const end = lastCheckOut ? new Date(lastCheckOut) : new Date();
    const totalWorkSeconds = Math.floor((end - firstCheckIn) / 1000);

    res.status(200).json({
      status: "successs",
      message: "Record(s) Fetched Successfully..!",
      firstCheckIn,
      lastCheckOut,
      totalWorkSeconds,
    });
  } catch (err) {
    console.error("Error fetching work summary:", err);
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { email, name, role, date, startDate, endDate } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Email is required",
      });
    }

    // let query = { email };
    let query = {};

    if (role === "Employee") {
      query.email = email;
    }

    if (name) {
      query.name = { $regex: "^" + name, $options: "i" };
    }

    const fromDate = new Date(startDate);
    const toDate = new Date(endDate);

    // Include the whole end day
    toDate.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      query.date = {
        $gte: fromDate,
        $lte: toDate,
      };
    }

    const user = await User.find();

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments(query);

    const employeeAttendenceList = await Attendance.find(query)
      .skip(skip)
      .limit(limit)
      .sort({
        date: -1,
      });

    const totals = role === "Employee" ? employeeAttendenceList.length : total;

    // // Count statuses
    // const presentCount = await Attendance.countDocuments({
    //   ...query,
    //   status: "Present",
    // });
    // const absentCount = await Attendance.countDocuments({
    //   ...query,
    //   status: "Absent",
    // });
    // const lateCount = await Attendance.countDocuments({
    //   ...query,
    //   status: "Late",
    // });

    return res.status(200).json({
      status: "success",
      message: "Attendance fetched successfully.",
      data: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: totals,
        employeeAttendenceList,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: "Error fetching attendance.",
      error: error.message,
    });
  }
};

const attendanceSummary = async (req, res) => {
  try {
    const today = moment().format("YYYY-MM-DD");

    // Get total employees
    const totalEmployees = await User.countDocuments();

    // Get today's attendance records
    const attendancesToday = await Attendance.find({ date: today });

    // Present and Late
    const presentCount = attendancesToday.filter(
      (a) => a.status === "Present"
    ).length;
    const lateCount = attendancesToday.filter(
      (a) => a.status === "Late"
    ).length;

    // Absent = total employees - (present + late)
    const absentCount = totalEmployees - (presentCount + lateCount);

    return res.status(200).json({
      status: "success",
      message: 'Record(s) Fetched Successfully',
      summary: {
        totalEmployees,
        presentEmployees: presentCount,
        lateArrivals: lateCount,
        absentEmployees: absentCount,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "fail",
      message: "Failed to fetch attendance summary",
      error: err.message,
    });
  }
};

export {
  sendCheckInsOtp,
  verifyCheckInsOtp,
  checkOut,
  workSummary,
  getAttendance,
  attendanceSummary
};
