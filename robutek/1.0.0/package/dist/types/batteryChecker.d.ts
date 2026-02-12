import { I2C } from "i2c";
export declare function startBatteryChecker(bus: I2C, setStatus: (status: number) => void): void;
