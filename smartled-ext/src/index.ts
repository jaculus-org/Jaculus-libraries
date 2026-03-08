import { SmartLed } from "smartled";
import { linearize, stretchChannelsEvenly } from "colors";
export {
  LedType,
  LED_WS2812,
  LED_WS2812B,
  LED_WS2812B_2020,
  LED_SK6812,
  LED_WS2813,
} from "smartled";

export interface SetOptions {
  /** Override the strip's linearize setting for this call. */
  linearize?: boolean;
  /** Override the strip's maxBrightness for this call (0-255). */
  maxBrightness?: number;
}

export class SmartLedExt {
  protected smartLed: SmartLed;
  protected indexFrom: number = 0;
  protected indexTo: number;
  private _maxBrightness: number = 255;
  /**
   * Get the current maximum brightness for the strip (0-255). Applied as a multiplier to all colors.
   */
  public get maxBrightness(): number {
    return this._maxBrightness;
  }

  /**
   * Set the maximum brightness for the strip (0-255). Applied as a multiplier to all colors.
   * Values outside the range will be clamped.
   */
  public set maxBrightness(value: number) {
    this._maxBrightness = Math.round(Math.min(Math.max(value, 0), 255));
  }

  /**
   * When true, gamma linearization is applied before sending each color.
   * Recommended for WS2812 / NeoPixel strips to get perceptually linear steps.
   */
  public doLinearize: boolean = true;

  // TODO: fix ranges
  constructor(smartLed: SmartLed, indexFrom?: number, indexTo?: number) {
    this.smartLed = smartLed;
    const count = smartLed.count;
    if (indexFrom !== undefined || indexTo !== undefined) {
      const from = indexFrom ?? 0;
      const to = indexTo ?? smartLed.count - 1;
      if (from < 0 || to >= smartLed.count || from > to) {
        throw new RangeError("Invalid indexFrom/indexTo range for SmartLedExt");
      }
      this.indexFrom = from;
      this.indexTo = to;
    } else {
      this.indexFrom = 0;
      this.indexTo = smartLed.count - 1;
    }
  }

  /** Apply the configured pipeline (brightness limit + optional linearization) to a color. */
  private applyPipeline(color: Rgb, opts?: SetOptions): Rgb {
    const maxBr = opts?.maxBrightness ?? this.maxBrightness;
    const doLin = opts?.linearize ?? this.doLinearize;
    let c = maxBr < 255 ? stretchChannelsEvenly(color, maxBr) : color;
    if (doLin) c = linearize(c);
    return c;
  }

  /**
   * Set the color of a single LED, applying the brightness limiter and
   * linearization pipeline.
   * @param index LED index (0 - (indexTo - indexFrom))
   * @param color RGB color
   * @param opts Per-call overrides for linearize / maxBrightness
   */
  public set(index: number, color: Rgb, opts?: SetOptions): void {
    if (index < 0 || index > this.indexTo - this.indexFrom) {
      throw new RangeError("LED index out of range for this SmartLedExt");
    }
    this.smartLed.set(this.indexFrom + index, this.applyPipeline(color, opts));
  }

  /**
   * Set the color of all LEDs in the strip.
   * @param color RGB color
   * @param opts Per-call overrides for linearize / maxBrightness
   */
  public setAll(color: Rgb, opts?: SetOptions): void {
    const processed = this.applyPipeline(color, opts);
    for (let i = this.indexFrom; i <= this.indexTo; i++) {
      this.smartLed.set(i, processed);
    }
  }

  /**
   * Turn off all LEDs in the strip.
   */
  public clear(): void {
    for (let i = this.indexFrom; i <= this.indexTo; i++) {
      this.smartLed.set(i, 0);
    }
  }

  /**
   * Set maxBrightness as a percentage (0-100).
   * @param percent Brightness percentage (0 = off, 100 = full)
   */
  public setMaxBrightnessPercent(percent: number): void {
    this.maxBrightness = Math.round(
      (Math.min(Math.max(percent, 0), 100) * 255) / 100,
    );
  }
}
