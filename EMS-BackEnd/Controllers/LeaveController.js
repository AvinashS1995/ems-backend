import { Holidays } from "../Models/holidayModel.js";
import { Leave } from "../Models/leaveModel.js"
import { User } from "../Models/UserModel.js"


const GetUpcomingHolidays = async (req, res) => {

    try {

        const today = new Date();
        const holidays = await Holidays.find({ date: { $gte: today } }).sort({ date: 1 }).select('-__v');

        if(!holidays) {
            return res.status(404).json({
                status: 'fail',
                message: 'Holidays Not Found..!'
            })
        }

        res.status(200).json({
            status: 'success',
            message: 'Record(s) Successfully Fetched..!',
            data: {
                upComingHolidays: holidays
            }
        })
        
    } catch (error) {
console.log(error)
        res.status(500).json({
            status: 'fail',
            message: error.message
        })
        
    }
}

const saveEmployeeLeave = async (req, res) => {

    try {

        const { empNo, name, leaveType, leaveDuration, fromDate, toDate,
            reasonType, reasonComment } = req.body;

            const newLeave = new Leave({
              empNo,
              name,
              leaveType,
              leaveDuration,
              fromDate,
              toDate,
              reasonType,
              reasonComment,
              status: 'Pending for Team Leader',
            });

            const savedLeave = await newLeave.save();

            res.status(201).json({
              message: "Leave application submitted successfully",
              data: {
                savedLeave
              },
            });
        
    } catch (error) {
        res.status(500).json({
            status: 'fail',
            message: error.message
        })
    }
}


// const approvalFlow = async (req, res) => {
//   try {
//     const { leaveId, action, role, approverComment, updatedBy } = req.body;

//     const leave = await Leave.findById(leaveId);

//     if (!leave) {
//       return res.status(404).json({
//         status: 'fail', 
//         message: 'Leave not found' 
//     });
//     }

//     const expectedStatus = {
//       TL: 'Pending for TL',
//       Manager: 'Pending for Manager',
//       HR: 'Pending for HR',
//     };

//     if (leave.status !== expectedStatus[role]) {
//       return res.status(400).json({ 
//         status: 'fail',
//         message: `Leave not pending with ${role}` 
//     });
//     }

//     let newStatus = '';
//     if (action === 'approve') {
//       newStatus =
//         role === 'TL' ? 'Pending for Manager' :
//         role === 'Manager' ? 'Pending for HR' :
//         'Final Approved';

//     } else if (action === 'reject') {
//       newStatus = `Rejected by ${role}`;

//     } else {
//       return res.status(400).json({
//         status: 'fail', 
//         message: 'Invalid action' 
//     });

//     }

//     leave.status = newStatus;
//     leave.approverComment = approverComment;
//     leave.updatedBy = updatedBy;
//     leave.updateAt = new Date();

//     await leave.save();

//     res.status(200).json({
//       status: 'success',  
//       message: `Leave ${action}d by ${role}`,
//       data: {
//         leave
//       },
//     });

//   } catch (error) {

//     res.status(500).json({ 
//         status: 'fail', 
//         error: error.message 
//     });
//   }
// };

const approvalFlow = async (req, res) => {
  try {
    const { leaveId } = req.body;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        status: 'fail',
        message: 'Leave not found',
      });
    }

    const user = await User.findOne({empNo:leave.empNo})

    // You can send back relevant info about the approval flow:
    res.status(200).json({
      status: 'success',
      data: {
        empNo: leave.empNo,
        name: leave.name,
        reasonComment: leave.reasonComment,
        createAt: leave.createAt,
        leaveStatus: leave.status,
        approverComment: leave.approverComment,
        updatedBy: leave.updatedBy,
        updateAt: leave.updateAt,
        appliedBy: leave.appliedBy || `${leave.empNo} - ${leave.name}`,
        tlApprover: user.teamLeader,
        managerApprover: user.manager,
        hrApprover: user.hr,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};


const LeaveRequestList = async (req, res) => {
  try {
    const { empNo, role } = req.body;

    if (!empNo || !role) {
      return res.status(400).json({
        status: 'fail',
        message: 'empNo and role are required'
      });
    }

   // Map actual role to expected status
    const roleStatusMap = {
      'Team Leader': 'Pending for Team Leader',
      'Manager': 'Pending for Manager',
      'HR': 'Pending for HR',
    };

    const expectedStatus = roleStatusMap[role];

    if (!expectedStatus) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid role provided'
      });
    }

    const leaveRequests = await Leave.find({
      status: expectedStatus
    }).sort({ createAt: -1 });

    res.status(200).json({
      status: "success",
      message: "Leave requests fetched successfully!",
      data: {
        records: leaveRequests.length,
        leaveRequests
      },
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};


const approveRejectLeave = async (req, res) => {
  try {
    const { leaveId, action, role, approverComment, updatedBy } = req.body;

    const leave = await Leave.findById(leaveId);

    if (!leave) {
      return res.status(404).json({
        status: 'fail',
        message: 'Leave not found',
      });
    }

    // const expectedStatus = {
    //   TL: 'Pending for TL',
    //   Manager: 'Pending for Manager',
    //   HR: 'Pending for HR',
    // };

    const roleStatusMap = {
      'Team Leader': 'Pending for Team Leader',
      'Manager': 'Pending for Manager',
      'HR': 'Pending for HR',
    };

    const expectedStatus = roleStatusMap[role];

    if (leave.status !== expectedStatus) {
      return res.status(400).json({
        status: 'fail',
        message: `Leave not pending with ${role}`,
      });
    }

    let newStatus = '';
    if (action === 'Approved') {
      newStatus =
        role === 'Team Leader' ? 'Pending for Manager' :
        role === 'Manager' ? 'Pending for HR' :
        'Final Approved';

    } else if (action === 'Rejected') {
      newStatus = `Rejected by ${role}`;

    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid action',
      });
    }

    leave.status = newStatus;
    leave.approverComment = approverComment;
    leave.updatedBy = updatedBy;
    leave.updateAt = new Date();

    await leave.save();

    res.status(200).json({
      status: 'success',
      message: `Leave ${action}d by ${role}`,
      data: {
        leave,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message,
    });
  }
};



const getAllLeaves = async (req, res) => {
  try {
    const { empNo } = req.body;

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;


    const leaves = await Leave.find({empNo: empNo})
      .skip(skip)
      .limit(limit)
      .sort({
        date: -1,
      });

    const total = await Leave.countDocuments({empNo: empNo});


    res.status(200).json({
      status: "success",
      message: "Record(s) Successfully Fetched!",

      data: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: leaves.length,
        leaves,
      },
    });

  } catch (error) {

    res.status(500).json({ 
        status: 'fail', 
        message: error.message 
    });
  }
};



export { GetUpcomingHolidays, saveEmployeeLeave, approvalFlow, LeaveRequestList, approveRejectLeave, getAllLeaves }