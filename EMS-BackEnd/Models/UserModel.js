import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    empNo: {
        type: String,
    },
    name: {
        type: String,
        required: [true, 'Name is required field']
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
    teamLeader: {
        type: String,
        required: [true, 'Team Leader is requied field']
    },
    manager: {
        type: String,
        required: [true, 'Manager is requied field']
    },
    hr: {
        type: String,
        required: [true, 'HR is requied field']
    },
    designation: {
        type: String,
        required: [true, 'Designation is requied field']
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
        data: Buffer,
        contentType: String,
      },
    createAt: {
        type: Date, default: Date.now
    },
    updateAt: {
        type: Date, default: Date.now
    }
})

const User = mongoose.model("User", userSchema);

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


export  { User, Type };