import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './Routes/authRoute.js';
// import verifyToken from './Middlewares/verifyTokenMiddleware.js';
import menuRouter from './Routes/menuRoute.js'
import uploadRoute from './Routes/uploadRoute.js';
import attendenceRoute from './Routes/attendenceRoute.js';
import leaveRoute from './Routes/leaveRoute.js';
import { ConnectToDatabase } from './db/db.js';
import setupSwagger from './swagger/swagger.js';
import startCron from './crons/fetchHolidays.js';


dotenv.config({path:'./.env'});

ConnectToDatabase();
const app = express();
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());
app.use('/api/auth', authRouter);
// app.use(verifyToken);
app.use('/api/menu', menuRouter)
app.use('/api/upload', uploadRoute)
app.use('/api/attendence', attendenceRoute)
app.use('/api/leave', leaveRoute)


setupSwagger(app);

startCron();

app.listen(process.env.PORT, () => {
    console.log(`Server is Running on Port ${process.env.PORT}`);
    
})