// utils/convertPhToUtcDate.js
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a date/time string in Asia/Manila to a UTC JavaScript Date object.
 * @param {string} datetimeString - e.g. '2025-05-09 06:18'
 * @returns {Date} UTC Date object
 */
function convertPhToUtcDate(datetimeString) {
  const tz = "Asia/Manila";
  return dayjs.tz(datetimeString, "YYYY-MM-DD HH:mm", tz).utc().toDate();
}

module.exports = { convertPhToUtcDate };
