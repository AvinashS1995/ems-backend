import { ConnectToDatabase } from "../db/db.js";
import { Type, User } from "../Models/UserModel.js";
import bcrypt from "bcrypt";

const CreateUser = async (req, res) => {

  try {
    const {
      name,
      email,
      role,
      mobile,
      status,
      type,
      teamLeader,
      manager,
      hr,
      designation,
      joiningDate,
      salary,
      workType,
      profileImage,
    } = req.body;

    if (
      !name ||
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

     // Find the last inserted employee sorted by empNo
     const lastEmp = await User.findOne()
     .sort({ empNo: -1 })
     .collation({ locale: "en_US", numericOrdering: true });

   let empNo = 'EMP001'; 

   if (lastEmp && lastEmp.empNo) {
     const lastNumber = parseInt(lastEmp.empNo.replace('EMP', ''));
     const newNumber = lastNumber + 1;
     empNo = `EMP${String(newNumber).padStart(3, '0')}`;
   }

    const password = "Admin@1234";
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      empNo,
      name,
      email,
      password: hashPassword,
      role,
      mobile,
      status,
      type,
      teamLeader,
      manager,
      hr,
      designation,
      joiningDate,
      salary,
      workType,
    });

    await newUser.save();
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
    const { name, role , status, type} = req.body;

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
      query.name = { $regex: '^' + name, $options: 'i' };
    }

    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    // const data = await User.find().skip(skip).limit(limit);

    
      const users = await User.find(query).skip(skip).limit(limit);

    res.status(200).json({
      status: "success",
      message: "Record(s) Fetched Successfully..!",
      data: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        users
        
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
      name,
      email,
      mobile,
      role,
      status,
      type,
      teamLeader,
      manager,
      hr,
      designation,
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

    existingType.name = name;
    existingType.email = email;
    existingType.mobile = mobile;
    existingType.role = role;
    existingType.status = status;
    existingType.teamLeader = teamLeader;
    existingType.manager = manager;
    existingType.hr = hr;
    existingType.designation = designation;
    existingType.joiningDate = joiningDate;
    existingType.salary = salary;
    existingType.workType = workType;
    existingType.profileImage = profileImage;

    await existingType.save();

    res.status(200).json({
      status: "success",
      message: "Record(s) Updated Successfully!",
      data: {
        existingType
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
        deleted
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
    const { entityValue, typeLabel, description } = req.body;

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
    const { entityValue , typeLabel} = req.body;

    // const query = entityValue ? { entityValue } : {};
    
    const query = {};

    if (entityValue) {
      query.entityValue = entityValue;
    }

    if (typeLabel) {
      query.typeLabel = typeLabel;
    }

    
      const types = await Type.find(query).select('_id entityValue typeLabel typeValue description');

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
    const { id, entityValue, typeLabel, description } = req.body;

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

export { CreateUser, GetUserList, UpdateEmployeeList, DeleteEmployeeList, CreateTypeList, GetTypeList, UpdateTypeList, DeleteTypeList };
