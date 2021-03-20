/**
 * Helper function that extracts unique numbers and string values
 * from an array based on an accessor. Returns an array of the
 * unique values.
 */
export default function uniqueValues(array, accessor = d => d) {
  if (!array) {
    return undefined;
  }

  const values = {};
  array.map(accessor).forEach((d) => { values[d] = d; });

  return Object.keys(values).map(key => values[key]);
}
