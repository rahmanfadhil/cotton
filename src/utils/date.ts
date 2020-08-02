/**
 * Format Date object to be "YYYY-MMMM-DD HH:mm:ss" string
 * 
 * @param date The date will be formatted
 */
export function formatDate(date: Date): string {
  // Format date to be "YYYY-MM-DD"
  const dateString = formatZerolessValue(date.getFullYear()) + "-" +
    formatZerolessValue(date.getMonth() + 1) + "-" +
    formatZerolessValue(date.getDate());

  // Format date time to be "HH:mm:ss"
  const timeString = formatZerolessValue(date.getHours()) +
    ":" + formatZerolessValue(date.getMinutes()) +
    ":" + formatZerolessValue(date.getSeconds());

  return `${dateString} ${timeString}`;
}

/**
 * Generate a new migration timestamps
 */
export function createMigrationTimestamp(): string {
  const date = new Date();
  const dateString = formatZerolessValue(date.getFullYear()) +
    formatZerolessValue(date.getMonth() + 1) +
    formatZerolessValue(date.getDate()) +
    formatZerolessValue(date.getHours()) +
    formatZerolessValue(date.getMinutes()) +
    formatZerolessValue(date.getSeconds());
  return dateString;
}

/**
 * Formats given number to "0x" format, e.g. if it is 1 then it will return "01".
 * 
 * @param value the number which will be formatted
 */
function formatZerolessValue(value: number): string {
  if (value < 10) {
    return "0" + value;
  }

  return String(value);
}

/**
 * Check if the given date is valid.
 */
export function isValidDate(date: Date): boolean {
  return date.constructor === Date && !isNaN(date.getTime());
}
