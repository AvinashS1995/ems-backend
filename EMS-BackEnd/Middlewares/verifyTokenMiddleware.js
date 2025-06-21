import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { User } from "../Models/UserModel.js";

dotenv.config({path:'./.env'});



const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    // console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({
        status: 'fail',
        message: 'Un-Authorized Access...!'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = decoded;
    next();
  } catch (error) {
    // console.error("JWT verification error:", error.message);
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid Token...!'
    });
  }
};



// const verifyToken = (req, res, next) => {
//   try {
//     const token = req.header("auth-token").split(" ")[1];

//     if (!token) {
//       res.status(401).json({
//         status: "fail",
//         message: "Access Denied",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

//     if (!decoded) {
//       res.status(404).json({
//         status: "fail",
//         message: "Invalid Token",
//       });
//     }

//     const user = User.findById(decoded._id).select("-password");

//     if (!user) {
//       res.status(404).json({
//         status: "fail",
//         message: "User Not Found",
//       });
//     }

//     res.user = user;
//     next();
//   } catch (error) {
//     res.status(500).json({
//       status: "fail",
//       message: error.message,
//     });
//   }
// };



export { authenticateToken};
