import { PulseCounter, LevelAction, EdgeAction } from "pulseCounter";

/**
 * RotaryEncoder simplifies the usage of a rotary encoder
 * by preconfiguring the PulseCounter class with appropriate
 * level and edge actions for a rotary encoder.
 */
export class RotaryEncoder extends PulseCounter {
  constructor(pinLevel: number, pinEdge: number) {
    super({
      pinLevel: pinLevel,
      pinEdge: pinEdge,
      levelMode: {
        low: LevelAction.Inverse,
        high: LevelAction.Keep,
      },
      edgeMode: {
        pos: EdgeAction.Increase,
        neg: EdgeAction.Decrease,
      },
    });
  }
}
