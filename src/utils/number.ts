/**
 * Create an array between two numbers
 * 
 * @param start first number
 * @param end last number
 */
export function range(start: number, end: number): number[] {
  var arr = [];

  while (start <= end) {
    arr.push(start++);
  }

  return arr;
}
