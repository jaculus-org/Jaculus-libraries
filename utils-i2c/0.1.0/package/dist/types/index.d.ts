import { I2C } from "i2c";
export declare function readInt16(bus: I2C, address: number, reg: number): number;
export declare function readInt32(bus: I2C, address: number, reg: number): number;
export declare function i2cScan(bus: I2C): number[];
export declare function i2cScanPrint(bus: I2C): void;
