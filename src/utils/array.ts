/**
 * Remove duplicate column names in an array.
 */
export function uniqueColumnNames<T>(columns: T[]): T[] {
  const a = columns.concat();

  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      const left = a[i];
      const right = a[j];

      if (left === right) {
        a.splice(j--, 1);
      } else if (
        (Array.isArray(left) && Array.isArray(right)) &&
        left[1] === right[1]
      ) {
        a.splice(j--, 1);
      }
    }
  }

  return a;
}
