import * as i2c from "i2c";
export declare class LM75A {
    readonly bus: i2c.I2C;
    readonly addr: number;
    /**
     * Creates a new instance of the LM75A temperature sensor.
     * @param bus The I2C bus used for communication
     * @param addrBits Selects the I2C address (addr | (addrBits & 0b111))
     */
    constructor(bus: i2c.I2C, addrBits: number);
    /**
     * Initializes the sensor
     */
    private init;
    /**
     * Reads the temperature in degrees Celsius.
     */
    readTemperature(): number;
}
