import mongoose from "mongoose";
import dotenv from "dotenv";
import grid from 'gridfs-stream';
import { GridFSBucket } from 'mongodb';


dotenv.config({path:'./.env'});
// const mongoURI = process.env.MONGO_DB_LOCAL_URL;
const mongoURI = process.env.MONGO_DB_LIVE_URL;
// console.log(`Process dotenv ${process.env}`);

let gfs;

const ConnectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log(`Database is Connected and Running Url ${process.env.MONGO_DB_LIVE_URL}`)

        const db = mongoose.connection.db;
        // console.log("DB---->", db)
        gfs = new GridFSBucket(db, {
          bucketName: 'uploads',
        });
    
        return { db, gfs };
        
    } catch (error) {
        console.log("Mongo Errorrr",error);
        console.log(`Process dotenv ${process.env.MONGO_DB_LOCAL_URL}`);

        
        
    }
}




export { ConnectToDatabase, gfs};