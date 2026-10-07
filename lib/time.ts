export const TIMEZONE = 'Asia/Jakarta';

/**
 * Returns current Date object in WIB or converted
 */
export function getNowWIB(): Date {
  return new Date();
}

/**
 * Formats current date to YYYY-MM-DD in Asia/Jakarta timezone.
 */
export function getTodayDateWIB(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Formats current time to HH:mm:ss in Asia/Jakarta timezone.
 */
export function getTimeWIB(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(/\./g, ':');
}

/**
 * Formats date into Indonesian locale string: "07 Oktober 2026"
 */
export function formatIndonesianDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formats timestamp to time display "06:52:31 WIB"
 */
export function formatDisplayTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d).replace(/\./g, ':');
  return `${time} WIB`;
}

/**
 * Compares current time with late_threshold to determine status.
 * e.g., if threshold is "07:15:00" and current time is "07:18:00" -> 'late'
 */
export function determineAttendanceStatus(
  currentTimeStr: string, // "06:52:31"
  lateThreshold: string = '07:15:00'
): 'present' | 'late' {
  const currParts = currentTimeStr.split(':').map((p) => parseInt(p, 10) || 0);
  const threshParts = lateThreshold.split(':').map((p) => parseInt(p, 10) || 0);

  const currSeconds = (currParts[0] || 0) * 3600 + (currParts[1] || 0) * 60 + (currParts[2] || 0);
  const threshSeconds = (threshParts[0] || 0) * 3600 + (threshParts[1] || 0) * 60 + (threshParts[2] || 0);

  return currSeconds > threshSeconds ? 'late' : 'present';
}
