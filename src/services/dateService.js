/**
 * Date Service - Handles timezone-aware date operations
 * Uses Intl.DateTimeFormat (built-in), no extra date libraries
 */

/**
 * Get today's date string (YYYY-MM-DD) in the given timezone
 * @param {string} timezone - IANA timezone string (e.g., 'Asia/Kolkata')
 * @returns {string} date string in YYYY-MM-DD format
 */
export function getTodayString(timezone = 'Asia/Kolkata') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA gives YYYY-MM-DD
}

/**
 * Get yesterday's date string (YYYY-MM-DD) in the given timezone
 * @param {string} timezone - IANA timezone string
 * @returns {string} date string in YYYY-MM-DD format
 */
export function getYesterdayString(timezone = 'Asia/Kolkata') {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(yesterday);
}

/**
 * Check if two date strings represent different days
 * @param {string|null} lastDateString - previous date string (YYYY-MM-DD) or null
 * @param {string} currentDateString - current date string (YYYY-MM-DD)
 * @returns {boolean} true if it's a new day
 */
export function isNewDay(lastDateString, currentDateString) {
  if (!lastDateString) return true;
  return lastDateString !== currentDateString;
}

export default {
  getTodayString,
  getYesterdayString,
  isNewDay,
};