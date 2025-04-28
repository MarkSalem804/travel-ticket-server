/**
 * Returns the start and end of the current day in the server's local timezone.
 * @returns {{ start: Date, end: Date }} An object with 'start' and 'end' Date objects.
 */
function getTodayDateRange() {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0); // 12:00 AM

  const end = new Date(now);
  end.setHours(23, 59, 59, 999); // 11:59:59.999 PM

  return { start, end };
}

module.exports = { getTodayDateRange };
