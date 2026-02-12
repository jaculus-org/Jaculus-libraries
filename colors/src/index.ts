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
export function hslToRgb(hsl: Hsl): Rgb {
  const chroma = 1 - Math.abs(2 * hsl.l - 1) * hsl.s;
  const hue = hsl.h / 60;
  const x = chroma * (1 - Math.abs((hue % 2) - 1));

  let color: Rgb = { r: 0, g: 0, b: 0 };
  if (hue > 0 && hue < 1) {
    color = { r: chroma, g: x, b: 0 };
  } else if (hue >= 1 && hue < 2) {
    color = { r: x, g: chroma, b: 0 };
  } else if (hue >= 2 && hue < 3) {
    color = { r: 0, g: chroma, b: x };
  } else if (hue >= 3 && hue < 4) {
    color = { r: 0, g: x, b: chroma };
  } else if (hue >= 4 && hue < 5) {
    color = { r: x, g: 0, b: chroma };
  } else {
    color = { r: chroma, g: 0, b: x };
  }
  const correction = hsl.l - chroma / 2;
  color.r = (color.r + correction) * 255;
  color.g = (color.g + correction) * 255;
  color.b = (color.b + correction) * 255;

  return color;
}

/**
 * Convert HEX color to RGB color
 * @param hex {string} HEX color string in format #RRGGBB
 * @returns {Rgb} Red (0-255), Green (0-255), Blue (0-255)
 */
export function hexaToRgb(hex: string): Rgb {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  if (hex.length !== 6) {
    throw new Error("Invalid HEX color format. Expected format: #RRGGBB");
  }

  // Parse r, g, b components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Function rainbow fixes saturation and brightness, and cycles through colors
 * @param hue (0-360)
 * @param brightness (0-100) - 50 is the default value
 * @returns {Rgb}
 */
export function rainbow(hue: number, brightness: number = 50): Rgb {
  hue = Math.min(hue, 360);
  // fix range to 0-100
  let brightness_mapped = Math.min(Math.max(brightness, 0), 100);
  return hslToRgb({ h: hue, s: 1, l: brightness_mapped / 100 });
}

/**
 * Convert sensor data [r, g, b] in range 0-1 to RGB color in range 0-255
 * @param data {[number, number, number]} Array of red, green, blue values (0-1)
 * @returns {Rgb} Red (0-255), Green (0-255), Blue (0-255)
 */
export function sensorDataToRGB(data: [number, number, number]): Rgb {
  const [r, g, b] = data;
  return {
    r: r * 255,
    g: g * 255,
    b: b * 255,
  };
}

/* Basic colors for LED strips */
export const red = rainbow(0);
export const orange = rainbow(27);
export const yellow = rainbow(54);
export const green = rainbow(110);
export const light_blue = rainbow(177);
export const blue = rainbow(240);
export const purple = rainbow(285);
export const pink = rainbow(323);
export const white: Rgb = { r: 100, g: 100, b: 100 };
export const off: Rgb = { r: 0, g: 0, b: 0 };
