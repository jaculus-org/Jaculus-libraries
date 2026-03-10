import { SmartLed } from "smartled";
export { LedType, LED_WS2812, LED_WS2812B, LED_WS2812B_2020, LED_SK6812, LED_WS2813, } from "smartled";
export interface SetOptions {
    /** Override the strip's linearize setting for this call. */
    linearize?: boolean;
    /** Override the strip's maxBrightness for this call (0-255). */
    maxBrightness?: number;
}
export declare class SmartLedExt {
    protected smartLed: SmartLed;
    protected indexFrom: number;
    protected indexTo: number;
    private _maxBrightness;
    /**
     * Get the current maximum brightness for the strip (0-255). Applied as a multiplier to all colors.
     */
    get maxBrightness(): number;
    /**
     * Set the maximum brightness for the strip (0-255). Applied as a multiplier to all colors.
     * Values outside the range will be clamped.
     */
    set maxBrightness(value: number);
    /**
     * When true, gamma linearization is applied before sending each color.
     * Recommended for WS2812 / NeoPixel strips to get perceptually linear steps.
     */
    doLinearize: boolean;
    constructor(smartLed: SmartLed, indexFrom?: number, indexTo?: number);
    /** Apply the configured pipeline (brightness limit + optional linearization) to a color. */
    private applyPipeline;
    /**
     * Set the color of a single LED, applying the brightness limiter and
     * linearization pipeline.
     * @param index LED index (0 - (indexTo - indexFrom))
     * @param color RGB color
     * @param opts Per-call overrides for linearize / maxBrightness
     */
    set(index: number, color: Rgb, opts?: SetOptions): void;
    /**
     * Set the color of all LEDs in the strip.
     * @param color RGB color
     * @param opts Per-call overrides for linearize / maxBrightness
     */
    setAll(color: Rgb, opts?: SetOptions): void;
    /**
     * Turn off all LEDs in the strip.
     */
    clear(): void;
    /**
     * Set maxBrightness as a percentage (0-100).
     * @param percent Brightness percentage (0 = off, 100 = full)
     */
    setMaxBrightnessPercent(percent: number): void;
}
