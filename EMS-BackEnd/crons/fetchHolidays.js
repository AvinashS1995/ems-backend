import cron from "node-cron";
import axios from "axios";
import { Holidays } from "../Models/holidayModel.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export async function fetchAndSaveYearHolidays() {
  const year = new Date().getFullYear();

  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year}-12-31T23:59:59Z`;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    process.env.GOOGLE_CALENDER_ID,
  )}/events?key=${process.env.GOOGLE_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  try {
    const response = await axios.get(url);

    const holidays = (response.data.items || [])
      .filter((event) => event.start?.date)
      .map((event) => ({
        name: event.summary || "Holiday",
        date: event.start.date,
        description: event.description || "",
        year: year.toString(),
        month: (new Date(event.start.date).getMonth() + 1)
          .toString()
          .padStart(2, "0"),
      }));

    // Delete OLD year data
    await Holidays.deleteMany({});

    console.log(`[HOLIDAY] Old holiday data deleted.`);

    // Insert CURRENT year data
    if (holidays.length > 0) {
      await Holidays.insertMany(holidays);
    }

    console.log(`[HOLIDAY] ${year} holidays inserted successfully.`);
  } catch (error) {
    console.error(
      `[HOLIDAY] Error syncing holidays for ${year}:`,
      error.message,
    );
  }
}

export default function startGoogleCalendarHolidayCron() {
  cron.schedule(
    // "0 0 1 1 *",
    "43 1 * * *",
    async () => {
      console.log("[CRON] January 1st - Starting new year holiday sync...");

      await fetchAndSaveYearHolidays();
    },
    {
      timezone: "Asia/Kolkata",
    },
  );
}
