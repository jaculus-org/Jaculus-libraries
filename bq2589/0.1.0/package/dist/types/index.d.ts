import * as i2c from "i2c";
export declare class BQ2589 {
    readonly bus: i2c.I2C;
    constructor(bus: i2c.I2C);
    private setBit;
    startADCContinuous(): void;
    startADCOneshot(): void;
    readADC(): number;
    resetWatchdog(): void;
    readADCOneshot(): Promise<number>;
    startBatteryChecker(setStatus: (status: number) => void, batteryThreshold?: number, intervalMs?: number): void;
}
