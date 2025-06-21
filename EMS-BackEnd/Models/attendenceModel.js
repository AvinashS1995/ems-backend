import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required field']
},
designation: {
    type: String,
    required: true,
  },
  employmentType: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date, 
    default: null,
  },
  totalWorkedHours: {
    type: String, 
    default: null,
  },
  sessions: [
    {
      checkIn: Date,
      checkOut: Date
    }
  ],
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
