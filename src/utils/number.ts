/**
 * Number utilities
 */
export class NumberUtils {
  /**
   * Create an array between two numbers
   * 
   * @param start first number
   * @param end last number
   */
  static range(start: number, end: number): number[] {
    var arr = [];

    while (start <= end) {
      arr.push(start++);
    }

    return arr;
  }
}
