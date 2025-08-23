import startGoogleCalaenderHolidayCron from "./fetchHolidays.js";
import startBucketCleanUpCron from "./cleanupBucket.cron.js";
import startMonthlyPayslipCron from "./payrollCron.js";

export default function startCron() {
  startGoogleCalaenderHolidayCron();
  startBucketCleanUpCron();
  startMonthlyPayslipCron();
}
