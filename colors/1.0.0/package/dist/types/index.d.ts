/**
 * Colors utility functions and types
 * @module colors
 */
/**
 * A color is a simple triplet of red, green, and blue components
 * - R: red (range 0-255)
 * - G: green (range 0-255)
 * - B: blue (range 0-255)
 */
export interface Rgb {
    r: number;
    g: number;
    b: number;
}
/**
 * HSL color representation
 * - H: hue (range 0-360)
 * - S: saturation (range 0-1)
 * - L: lightness (range 0-1)
 */
export interface Hsl {
    h: number;
    s: number;
    l: number;
}
/**
 * Convert HSL color to RGB color
 * @param hsl {Hsl} Hue (0-360), Saturation (0-1), Lightness (0-1)
 * @returns {Rgb} Red (0-255), Green (0-255), Blue (0-255)
 */
export declare function hslToRgb(hsl: Hsl): Rgb;
/**
 * Convert HEX color to RGB color
 * @param hex {string} HEX color string in format #RRGGBB
 * @returns {Rgb} Red (0-255), Green (0-255), Blue (0-255)
 */
export declare function hexaToRgb(hex: string): Rgb;
/**
 * Function rainbow fixes saturation and brightness, and cycles through colors
 * @param hue (0-360)
 * @param brightness (0-100) - 50 is the default value
 * @returns {Rgb}
 */
export declare function rainbow(hue: number, brightness?: number): Rgb;
/**
 * Convert sensor data [r, g, b] in range 0-1 to RGB color in range 0-255
 * @param data {[number, number, number]} Array of red, green, blue values (0-1)
 * @returns {Rgb} Red (0-255), Green (0-255), Blue (0-255)
 */
export declare function sensorDataToRGB(data: [number, number, number]): Rgb;
export declare const red: Rgb;
export declare const orange: Rgb;
export declare const yellow: Rgb;
export declare const green: Rgb;
export declare const light_blue: Rgb;
export declare const blue: Rgb;
export declare const purple: Rgb;
export declare const pink: Rgb;
export declare const white: Rgb;
export declare const off: Rgb;
