/**
 * Small formatting helpers shared across pages.
 */

/** Today's date in the user's own timezone, as YYYY-MM-DD (not UTC). */
export function todayISO() {
  return toISODate(new Date());
}

/** A Date -> YYYY-MM-DD in local time. */
export function toISODate(date) {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** "09:05:00" -> "09:05". Leaves anything unexpected alone. */
export function formatTime(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : String(value);
}

/** Normalise a "HH:MM(:SS)" string so timetable slots can be compared. */
export function timeToMinutes(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
