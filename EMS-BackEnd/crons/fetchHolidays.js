
import cron from 'node-cron';
import axios from 'axios';
import moment from 'moment';
import { Holidays } from '../Models/holidayModel.js';
import dotenv from 'dotenv';


dotenv.config({path:'./.env'});

export async function fetchAndSaveYearHolidays() {

    const year = new Date().getFullYear();
    const timeMin = `${year}-01-01T00:00:00Z`; 
    const timeMax = `${year}-12-31T23:59:59Z`; 
    console.log(process.env)

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDER_ID)}/events?key=${process.env.GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    try {

        const response = await axios.get(url);
        const holidays = response.data.items.map(event => ({
            name: event.summary,
            date: event.start.date,
            description: event.description || '',
            year: year.toString(),
            month: (new Date(event.start.date).getMonth() + 1).toString().padStart(2, '0')
        }));

        await Holidays.deleteMany({ year });  // Clear holidays for the year
        await Holidays.insertMany(holidays);

        console.log(`[CRON] Holidays fetched and stored for year ${year}`);
        
    } catch (error) {
        console.error(`[CRON] Error fetching holidays for year ${year}:`, error.message);

    }
}

export default function startCron() {
    cron.schedule('0 0 1 1 *', () => {
        console.log('[CRON] Running yearly holiday fetch...');
        fetchAndSaveYearHolidays();
    });

    // Optional: run immediately at startup
    // fetchAndSaveYearHolidays();
}
