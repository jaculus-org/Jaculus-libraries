/**
 * Scales a value to a range of 0-1 based on the given minimum and maximum values.
 * @param value The value to scale.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns The scaled value between 0 and 1.
 */
export function scale(value: number, min: number, max: number): number {
  const val = (value - min) / (max - min);
  return Math.min(Math.max(val, 0), 1);
}

/** * Maps a value from one range to another.
 * @param value The value to map.
 * @param inMin The minimum value of the input range.
 * @param inMax The maximum value of the input range.
 * @param outMin The minimum value of the output range.
 * @param outMax The maximum value of the output range.
 * @returns The mapped value in the output range.
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  if (inMin === inMax) return outMin;

  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
