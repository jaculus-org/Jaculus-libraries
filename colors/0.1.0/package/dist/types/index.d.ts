/**
 * Colors utility functions and types
 * @module colors
 */
type Rgb = number;
/**
 * Convert RGB color to a number in format 0xRRGGBB
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export declare function rgb(r: number, g: number, b: number): Rgb;
export declare function rgbToString(color: Rgb): string;
/**
 * Convert HSL color to RGB color
 * @param hue (0-360)
 * @param saturation (0-100) %
 * @param lightness (0-100) %
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export declare function hslToRgb(hue: number, saturation: number, lightness: number): Rgb;
/**
 * Convert HEX color to RGB color
 * @param hex {string} HEX color string in format #RRGGBB
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export declare function hexToRgb(hex: string): Rgb;
/**
 * Apply gamma linearization (x^3 approximation) to an RGB color.
 * Suitable for WS2812 / NeoPixel LED strips.
 * @param color RGB color (format 0xRRGGBB)
 * @returns Linearized RGB color (format 0xRRGGBB)
 */
export declare function linearize(color: Rgb): Rgb;
/**
 * Stretch each channel of an RGB color to a given maximum using (value * max) >> 8.
 * @param color RGB color (format 0xRRGGBB)
 * @param maxR Maximum value for red channel (0-255)
 * @param maxG Maximum value for green channel (0-255)
 * @param maxB Maximum value for blue channel (0-255)
 * @returns Stretched RGB color (format 0xRRGGBB)
 */
export declare function stretchChannels(color: Rgb, maxR: number, maxG: number, maxB: number): Rgb;
/**
 * Stretch all channels evenly to the same maximum.
 * @param color RGB color (format 0xRRGGBB)
 * @param max Maximum value for all channels (0-255)
 * @returns Stretched RGB color (format 0xRRGGBB)
 */
export declare function stretchChannelsEvenly(color: Rgb, max: number): Rgb;
/**
 * Function rainbow fixes saturation and brightness, and cycles through colors
 * @param hue (0-360)
 * @param brightness (0-100) - 50 is the default value
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export declare function rainbow(hue: number, brightness?: number): Rgb;
export declare const red: number;
export declare const orange: number;
export declare const yellow: number;
export declare const green: number;
export declare const light_blue: number;
export declare const blue: number;
export declare const purple: number;
export declare const pink: number;
export declare const white: Rgb;
export declare const off: Rgb;
export {};
