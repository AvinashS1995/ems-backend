import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./Routes/authRoute.js";
// import verifyToken from './Middlewares/verifyTokenMiddleware.js';
import menuRouter from "./Routes/menuRoute.js";
import attendenceRoute from "./Routes/attendenceRoute.js";
import leaveRoute from "./Routes/leaveRoute.js";
import fileRoute from "./Routes/fileRoute.js";
import approvalRoute from "./Routes/approvalRoute.js";
import popupRoute from "./Routes/popupRoute.js";
import meetingRoutes from "./Routes/meetingRoute.js";
import payrollRoutes from "./Routes/payrollRoute.js";
import projectRoutes from "./Routes/projectTaskRoute.js";
import weatherRoutes from "./Routes/weatherRoute.js";
import invoiceRoutes from "./Routes/invoiceRoute.js";
import { ConnectToDatabase } from "./db/db.js";
import setupSwagger from "./swagger/swagger.js";
import startCron from "./crons/cronRun.js";

dotenv.config({ path: "./.env" });

ConnectToDatabase();
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://ems-project-kappa.vercel.app",
      "https://weather-forecast-dashboard-theta.vercel.app",
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/api/auth", authRouter);
// app.use(verifyToken);
app.use("/api/menu", menuRouter);
app.use("/api/attendence", attendenceRoute);
app.use("/api/leave", leaveRoute);
app.use("/api/file", fileRoute);
app.use("/api/approval", approvalRoute);
app.use("/api/popup", popupRoute);
app.use("/api/meeting", meetingRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/invoice", invoiceRoutes);

setupSwagger(app);

startCron();

app.listen(process.env.PORT, () => {
  console.log(`Server is Running on Port ${process.env.PORT}`);
});
