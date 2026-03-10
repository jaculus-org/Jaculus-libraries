import { I2C } from "i2c";
export type DateTime = {
    year: number;
    month: number;
    date: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
};
export declare class DS3231 {
    readonly bus: I2C;
    readonly addr: number;
    /**
     * Creates a new instance of the DS3231 RTC.
     * @param bus The I2C bus used for communication
     * @param address Optional I2C address (default 0x68)
     */
    constructor(bus: I2C, address?: number);
    /**
     * Reads date and time from the RTC.
     * @returns Current date and time from the DS3231
     */
    readTime(): DateTime;
    /**
     * Sets date and time on the RTC.
     * @param time Date and time to set (year 2000-2199 recommended)
     */
    setTime(time: DateTime): void;
    /**
     * Reads temperature in degrees Celsius from the DS3231.
     */
    readTemperature(): number;
}
