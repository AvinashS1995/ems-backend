import mongoose from "mongoose";

const ChildMenuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  componentName: {
    type: String,
    required: true,
  },
  description: String,
  icon: String,
  sequence: Number,
  childMenu: [], 
});

const MenuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required field..!"],
  },
  path: {
    type: String,
    required: [true, "Path is required field..!"],
  },
  componentName: {
    type: String,
    required: [true, "Component Name is required field..!"],
  },
  description: {
    type: String,
  },
  icon: {
    type: String,
  },
  // parentMenu: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Menu",
  //   default: null,
  // },
  childMenu: [ChildMenuSchema],
  sequence: {
    type: Number,
    unique: true,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
});



const Menu = mongoose.model("Menu", MenuSchema);

const RoleMenuSchema = new mongoose.Schema({
  role: {
    type: String,
    required: [true, "Role is required field..!"],
  },
  menus: [
    {
      menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        required: true,
      },
      access: {
        type: String,
        enum: ["noAccess", "fullAccess"],
        default: "noAccess",
      },
    },
  ],
  updateAt: {
    type: Date,
    default: Date.now,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
});

const RoleMenu = mongoose.model("RoleMenu", RoleMenuSchema);

export { Menu, RoleMenu };
