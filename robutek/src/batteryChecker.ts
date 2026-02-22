import { BQ2589 } from "bq2589";
import { I2C } from "i2c";

const BATTERY_THRESHOLD = 3.2;

export function startBatteryChecker(
  bus: I2C,
  setStatus: (status: number) => void,
) {
  let blinkTimer: number | undefined = undefined;
  let blinkState = false;
  const bq2589 = new BQ2589(bus);

  setInterval(async () => {
    const u = await bq2589.readADCOneshot();
    if (u < BATTERY_THRESHOLD && blinkTimer === undefined) {
      blinkTimer = setInterval(() => {
        blinkState = !blinkState;
        setStatus(blinkState ? 1 : 0);
        if (blinkState) {
          console.log(`Battery low: ${u.toFixed(2)} V`);
        }
      }, 500);
    } else if (u >= BATTERY_THRESHOLD && blinkTimer !== undefined) {
      clearInterval(blinkTimer);
      setStatus(0);
      blinkTimer = undefined;
    }
  }, 10000);
}
