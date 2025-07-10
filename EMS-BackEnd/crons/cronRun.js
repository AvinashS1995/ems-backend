

import startGoogleCalaenderHolidayCron from './fetchHolidays.js';
import startBucketCleanUpCron from './cleanupBucket.cron.js';


export default function startCron() {
    
startGoogleCalaenderHolidayCron();
startBucketCleanUpCron();
  
}



