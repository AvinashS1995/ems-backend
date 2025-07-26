import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    empNo: {
        type: String,
    },
    firstName: {
        type: String,
        required: [true, 'First Name is required field']
    },
    middleName: {
        type: String,
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is required field']
    },
    dob: {
        type: String,
        required: [true, 'Date Of Birth is required field']
    },
    gender: {
        type: String,
        required: [true, 'Gender is required field']
    },
    email: {
        type: String,
        required: [true, 'Email is required field'],
        unique: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile is required field'],
        unique: true
    },
    address: {
        type: String,
        required: [true, 'Address is required field'],
    },
    country: {
        type: String,
    },
    password: {
        type: String,
        required: [true, 'Password is required field']
    },
    role: {
        type: String,
        required: [true, 'Role is requied field']
    },
    type: {
        type: String,
        required: [true, 'Type is requied field']
    },
    status: {
        type: String,
        required: [true, 'Status is requied field']
    },
    reportedBy: {
        type: String,
        required: [true, 'Reported By is requied field']
    },
    designation: {
        type: String,
        required: [true, 'Designation is requied field']
    },
    department: {
        type: String,
        required: [true, 'Department is requied field']
    },
    joiningDate: {
        type: String,
        required: [true, 'Joining Date is requied field']
    },
    salary: {
        type: Number,
        required: [true, 'Salary is requied field']
    },
    workType: {
        type: String,
        required: [true, 'Work Type is requied field']
    },
    profileImage: {
        type: String,
        
      },
    createAt: {
        type: Date, default: Date.now
    },
    updateAt: {
        type: Date, default: Date.now
    }
})

const User = mongoose.model("User", userSchema);

const userReportingSchema = new mongoose.Schema({
  employee: {
    type: String,
    required: true,
  },
  reportedByEmployee: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserReporting = mongoose.model("UserReporting", userReportingSchema);

const typeSchema = new mongoose.Schema({
    entityValue: {
        type: String,
        required: [true, 'Type is required field'],
    },
    typeLabel: {
        type: String,
        required: [true, 'Type Name is required field'],
        unique: true
    },
    typeValue: {
        type: Number,
        required: [true, 'Type Value is required field'],
        // unique: true
    },
     departmentType: {
        type: String,
    },
    description: {
        type: String,
        required: [true, 'Description is required field']
    },
    createAt: {
        type: Date, default: Date.now
    },
    updateAt: {
        type: Date, default: Date.now
    }
})

const Type = mongoose.model("Type", typeSchema)


export  { User, UserReporting, Type };