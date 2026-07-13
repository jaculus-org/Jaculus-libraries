/**
 * Scales a value to a range of 0-1 based on the given minimum and maximum values.
 * @param value The value to scale.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns The scaled value between 0 and 1.
 */
export function scale(value: number, min: number, max: number): number {
    if (min === max) return 0;

    const val = (value - min) / (max - min);
    return Math.min(Math.max(val, 0), 1);
}

/**
 * Maps a value from one range to another.
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

/**
 * Clamps a value between a minimum and maximum.
 * @param value The value to clamp.
 * @param min The minimum value to clamp to.
 * @param max The maximum value to clamp to.
 * @returns The clamped value.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Converts a string into a Uint8Array by mapping each character to its character code.
 * @param s The string to convert.
 * @returns A Uint8Array containing the character code byte values.
 */
export function strToBytes(s: string): Uint8Array {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
        bytes[i] = s.charCodeAt(i);
    }
    return bytes;
}

/**
 * Converts a Uint8Array or ArrayBuffer into a string using character codes.
 * @param b The Uint8Array or ArrayBuffer containing byte data.
 * @returns The reconstructed string.
 */
export function bytesToStr(b: Uint8Array | ArrayBuffer): string {
    const bytes = b instanceof ArrayBuffer ? new Uint8Array(b) : b;
    return String.fromCharCode.apply(null, bytes as unknown as number[]);
}

/**
 * Performs a byte-by-byte comparison of two Uint8Array instances to check for equality.
 * @param a The first Uint8Array to compare.
 * @param b The second Uint8Array to compare.
 * @returns True if both arrays are of equal length and contain identical bytes, false otherwise.
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
