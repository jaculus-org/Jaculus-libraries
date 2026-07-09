import { OneWire } from "onewire";

const SENSOR_ROM = 0x28;

enum Command {
    CONVERT_T = 0x44,
    READ_SCRATCHPAD = 0xbe,
    WRITE_SCRATCHPAD = 0x4e,
}

const READ_BYTES_COUNT = 9;
const TEMP_LSB_INDEX = 0;
const TEMP_MSB_INDEX = 1;

type ResolutionBits = 9 | 10 | 11 | 12;

const TIMEOUT_MAP: Record<ResolutionBits, number> = {
    9: 94,
    10: 188,
    11: 375,
    12: 750,
};

/**
 * Library for a DS18B20 temperature sensor on a 1-Wire bus.
 */
export class DS18B20 {
    private address: Uint8Array<ArrayBufferLike>;
    private onewire: OneWire;
    private resolutionBits: ResolutionBits;

    /**
     * Create a sensor instance for the specified data pin.
     *
     * @param pinNumber Pin connected to the DS18B20 data line.
     * @param resolutionBits Temperature resolution in bits. Supported values are 9, 10, 11, and 12.
     */
    constructor(pinNumber: number, resolutionBits: ResolutionBits = 11) {
        this.onewire = new OneWire(pinNumber);
        this.resolutionBits = resolutionBits;

        if (!this.onewire) {
            throw new Error("Failed to initialize OneWire");
        }

        const devices = this.onewire.search();
        const address = devices.find((rom) => rom[0] === SENSOR_ROM);

        if (!address) {
            this.onewire.close();
            throw new Error(
                `DS18B20 (family 0x${SENSOR_ROM.toString(16)}) not found`,
            );
        }
        this.address = address;
        this.setResolution();
    }

    /**
     * Release resources
     */
    close() {
        this.onewire.close();
    }

    private sendCommand(command: number | Uint8Array) {
        this.onewire.reset();
        this.onewire.select(this.address);
        this.onewire.write(command);
    }

    private startConversion() {
        this.sendCommand(Command.CONVERT_T);
    }

    private readScratchpad(): Uint8Array {
        this.sendCommand(Command.READ_SCRATCHPAD);
        return this.onewire.read(READ_BYTES_COUNT);
    }

    private setResolution() {
        this.onewire.reset();
        this.onewire.select(this.address);
        this.onewire.write(Command.WRITE_SCRATCHPAD);
        // Resolution is set in bits 5 and 6 of the configuration register
        const configByte = (this.resolutionBits - 9) << 5;
        // TH and TL registers are not used, set to 0
        this.onewire.write(new Uint8Array([0, 0, configByte]));
    }

    private validateScratchpad(scratchpad: Uint8Array): boolean {
        const data = scratchpad.slice(0, READ_BYTES_COUNT - 1); // exclude CRC byte
        const sensorCrc = scratchpad[8];
        const computedCrc = this.onewire.crc8(data);

        return computedCrc === sensorCrc;
    }

    private decodeTemperature(scratchpad: Uint8Array): number {
        let raw =
            (scratchpad[TEMP_MSB_INDEX] << 8) | scratchpad[TEMP_LSB_INDEX];
        // convert to signed 16-bit integer
        if (raw & 0x8000) {
            raw -= 0x10000;
        }

        // Convert to Celsius
        const tempC = raw / 16;
        return tempC;
    }

    /**
     * Read the current temperature from the sensor.
     *
     * @returns Temperature in degrees Celsius.
     * @throws If the scratchpad cannot be read or its CRC check fails.
     */
    async readTemperature(): Promise<number | undefined> {
        this.startConversion();

        await sleep(TIMEOUT_MAP[this.resolutionBits]);
        const scratchpad = this.readScratchpad();
        if (!scratchpad) {
            throw new Error("Failed to read scratchpad");
        }

        if (!this.validateScratchpad(scratchpad)) {
            throw new Error("Scratchpad CRC validation failed");
        }

        const tempC = this.decodeTemperature(scratchpad);
        return tempC;
    }
}
