import * as i2c from "i2c";
export type Calibration = {
    mins: number[];
    maxs: number[];
};
export declare class ZSCS2016C {
    readonly bus: i2c.I2C;
    private cal;
    private addr;
    /**
     * Creates a new instance of the ZSCS2016C color sensor.
     * @param bus The I2C bus used for communication
     * @param addrBit If true, uses address 0x43, otherwise 0x42
     */
    constructor(bus: i2c.I2C, addrBit: boolean);
    /**
     * Resets the sensor to its default state.
     */
    reset(): void;
    /**
     * Initializes the sensor
     */
    enable(): void;
    /**
     * Reads value of the red channel and applies calibration.
     * @returns Scaled value of the red channel (0-1)
     */
    readRed(): number;
    /**
     * Reads value of the green channel and applies calibration.
     * @returns Scaled value of the green channel (0-1)
     */
    readGreen(): number;
    /**
     * Reads value of the blue channel and applies calibration.
     * @returns Scaled value of the blue channel (0-1)
     */
    readBlue(): number;
    /**
     * Reads value of the IR channel and applies calibration.
     * @returns Scaled value of the IR channel (0-1)
     */
    readIR(): number;
    /**
     * Reads value of the clear channel (unfiltered color) and applies calibration.
     * @returns Scaled value of the clear channel (0-1)
     */
    readClear(): number;
    /**
     * Reads values of all RGB channels and applies calibration.
     * @note This method is more efficient and accurate than reading all channels individually.
     * @returns Array of scaled RGB values [R, G, B] (0-1)
     */
    readRGB(): [number, number, number];
    /**
     * Reads raw value of the red channel.
     * @returns Raw value of the red channel
     */
    readRawRed(): number;
    /**
     * Reads raw value of the green channel.
     * @returns Raw value of the green channel
     */
    readRawGreen(): number;
    /**
     * Reads raw value of the blue channel.
     * @returns Raw value of the blue channel
     */
    readRawBlue(): number;
    /**
     * Reads raw value of the IR channel.
     * @returns Raw value of the IR channel
     */
    readRawIR(): number;
    /**
     * Reads raw value of the clear channel (unfiltered color).
     * @returns Raw value of the clear channel
     */
    readRawClear(): number;
    /**
     * Reads raw values of all RGB channels.
     * @note This method is more efficient and accurate than reading all channels individually.
     * @returns Array of raw RGB values [R, G, B]
     */
    readRawRGB(): number[];
    /**
     * Runs a calibration procedure for the sensor. During the calibration, the sensor
     * should be placed on a white and a black surface. The resulting calibration
     * depends on the distance from the surface and lighting conditions.
     */
    runCalibration(): Promise<void>;
    /**
     * Returns the current calibration data.
     * @throws Error if calibration is not set
     * @returns The current calibration data
     */
    getCalibration(): Calibration;
    /**
     * Sets the calibration data.
     * @param cal The calibration data to set
     */
    setCalibration(cal: Calibration): void;
    /**
     * Saves the current calibration data to persistent storage.
     * @param id Identifier for the calibration data
     */
    saveCalibration(id: string): void;
    /**
     * Loads calibration data from persistent storage.
     * @param id Identifier for the calibration data
     */
    loadCalibration(id: string): void;
}
