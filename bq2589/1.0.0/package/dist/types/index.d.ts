import * as i2c from "i2c";
export declare function setBit(bus: i2c.I2C, address: number, reg: number, bit: number, value: boolean): void;
export declare function startADCContinuous(bus: i2c.I2C): void;
export declare function startADCOneshot(bus: i2c.I2C): void;
export declare function readADC(bus: i2c.I2C): number;
export declare function resetWatchdog(bus: i2c.I2C): void;
export declare function readADCOneshot(bus: i2c.I2C): Promise<number>;
