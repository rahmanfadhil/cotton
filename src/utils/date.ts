/**
 * Date formatting utility
 */
export class DateUtils {
  /**
   * Format Date object to be "YYYY-MMMM-DD HH:mm:ss" string
   * 
   * @param date The date will be formatted
   */
  static formatDate(date: Date): string {
    // Format date to be "YYYY-MM-DD"
    const dateString = this.formatZerolessValue(date.getFullYear()) + "-" +
      this.formatZerolessValue(date.getMonth() + 1) + "-" +
      this.formatZerolessValue(date.getDate());

    // Format date time to be "HH:mm:ss"
    const timeString = this.formatZerolessValue(date.getHours()) +
      ":" + this.formatZerolessValue(date.getMinutes()) +
      ":" + this.formatZerolessValue(date.getSeconds());

    return `${dateString} ${timeString}`;
  }

  /**
   * Formats given number to "0x" format, e.g. if it is 1 then it will return "01".
   * 
   * @param value the number which will be formatted
   */
  private static formatZerolessValue(value: number): string {
    if (value < 10) {
      return "0" + value;
    }

    return String(value);
  }
}
