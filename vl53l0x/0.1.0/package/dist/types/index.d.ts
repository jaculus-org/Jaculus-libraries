import { I2C } from "i2c";
export type Measurement = {
    distance: number;
    signalRate: number;
    ambientRate: number;
    effectiveSpadRtnCount: number;
};
export declare class VL53L0X {
    private i2c;
    private address;
    private StopVariable;
    constructor(i2c: I2C);
    /**
     * Set a new I2C address for the sensor.
     * @note Config is not persistant through power cycle.
     * @param newAddress The new I2C address to set.
     */
    setAddress(newAddress: number): void;
    /** initialise VL53L0X */
    private init;
    private r;
    private w;
    /**
     * Perform one measurement and return the result.
     * Returns an object of the form:
     * {
     *   distance , // distance in mm
     *   signalRate, // target reflectance
     *   ambientRate, // ambient light.
     *   effectiveSpadRtnCount //  effective SPAD count for the return signal
     * }
     */
    read(): Promise<Measurement>;
}
