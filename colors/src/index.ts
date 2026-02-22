/**
 * Colors utility functions and types
 * @module colors
 */

/**
 * Convert RGB color to a number in format 0xRRGGBB
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export function rgb(r: number, g: number, b: number): Rgb {
  return (r << 16) | (g << 8) | b;
}

/**
 * Convert HSL color to RGB color
 * @param hue (0-360)
 * @param saturation (0-1)
 * @param lightness (0-1)
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export function hslToRgb(
  hue: number,
  saturation: number,
  lightness: number,
): Rgb {
  const chroma = 1 - Math.abs(2 * lightness - 1) * saturation;
  const hueNormalized = hue / 60;
  const x = chroma * (1 - Math.abs((hueNormalized % 2) - 1));

  let r: number, g: number, b: number;
  if (hueNormalized > 0 && hueNormalized < 1) {
    r = chroma;
    g = x;
    b = 0;
  } else if (hueNormalized >= 1 && hueNormalized < 2) {
    r = x;
    g = chroma;
    b = 0;
  } else if (hueNormalized >= 2 && hueNormalized < 3) {
    r = 0;
    g = chroma;
    b = x;
  } else if (hueNormalized >= 3 && hueNormalized < 4) {
    r = 0;
    g = x;
    b = chroma;
  } else if (hueNormalized >= 4 && hueNormalized < 5) {
    r = x;
    g = 0;
    b = chroma;
  } else {
    r = chroma;
    g = 0;
    b = x;
  }
  const correction = hueNormalized - chroma / 2;
  r = Math.round((r + correction) * 255);
  g = Math.round((g + correction) * 255);
  b = Math.round((b + correction) * 255);

  return rgb(r, g, b);
}

/**
 * Convert HEX color to RGB color
 * @param hex {string} HEX color string in format #RRGGBB
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export function hexToRgb(hex: string): Rgb {
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  if (hex.length !== 6) {
    throw new Error("Invalid HEX color format. Expected format: #RRGGBB");
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return rgb(r, g, b);
}

/**
 * Apply gamma correction to a single channel (0-255).
 * Uses x^3 approximation with a bias of 4 for WS2812 LEDs.
 * @param channel Channel value (0-255)
 * @returns Gamma-corrected channel value (0-255)
 */
function channelGamma(channel: number): number {
  if (channel === 0) return 0;
  const c = (channel * channel * channel * 251) | 0;
  return (4 + (c >> 24)) & 0xff;
}

/**
 * Apply gamma linearization (x^3 approximation) to an RGB color.
 * Suitable for WS2812 / NeoPixel LED strips.
 * @param color RGB color (format 0xRRGGBB)
 * @returns Linearized RGB color (format 0xRRGGBB)
 */
export function linearize(color: Rgb): Rgb {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return rgb(channelGamma(r), channelGamma(g), channelGamma(b));
}

/**
 * Stretch each channel of an RGB color to a given maximum using (value * max) >> 8.
 * @param color RGB color (format 0xRRGGBB)
 * @param maxR Maximum value for red channel (0-255)
 * @param maxG Maximum value for green channel (0-255)
 * @param maxB Maximum value for blue channel (0-255)
 * @returns Stretched RGB color (format 0xRRGGBB)
 */
export function stretchChannels(
  color: Rgb,
  maxR: number,
  maxG: number,
  maxB: number,
): Rgb {
  const r = (((color >> 16) & 0xff) * maxR) >> 8;
  const g = (((color >> 8) & 0xff) * maxG) >> 8;
  const b = ((color & 0xff) * maxB) >> 8;
  return rgb(r, g, b);
}

/**
 * Stretch all channels evenly to the same maximum.
 * @param color RGB color (format 0xRRGGBB)
 * @param max Maximum value for all channels (0-255)
 * @returns Stretched RGB color (format 0xRRGGBB)
 */
export function stretchChannelsEvenly(color: Rgb, max: number): Rgb {
  return stretchChannels(color, max, max, max);
}

/**
 * Function rainbow fixes saturation and brightness, and cycles through colors
 * @param hue (0-360)
 * @param brightness (0-100) - 50 is the default value
 * @returns {Rgb} RGB color as a number in format 0xRRGGBB
 */
export function rainbow(hue: number, brightness: number = 50): Rgb {
  hue = Math.min(hue, 360);
  // fix range to 0-100
  let brightness_mapped = Math.min(Math.max(brightness, 0), 100);
  return hslToRgb(hue, 1, brightness_mapped / 100);
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
export const white: Rgb = 0xffffff;
export const off: Rgb = 0x000000;
