import { I2C } from "i2c";

enum Registers {
    GYRO_CONFIG = 27,
    ACCEL_CONFIG = 28,
    MOT_DUR = 0x20,
    MOT_THR = 31,
    INT_ENABLE = 56,
    MOT_INT = 58,
    ACCEL_XOUT_H = 59,
    ACCEL_XOUT_L = 60,
    ACCEL_YOUT_H = 61,
    ACCEL_YOUT_L = 62,
    ACCEL_ZOUT_H = 63,
    ACCEL_ZOUT_L = 64,
    TEMP_OUT_H = 65,
    TEMP_OUT_L = 66,
    GYRO_XOUT_H = 67,
    GYRO_XOUT_L = 68,
    GYRO_YOUT_H = 69,
    GYRO_YOUT_L = 70,
    GYRO_ZOUT_H = 71,
    GYRO_ZOUT_L = 72,
    PWR_MGMT_1 = 107
}

const MPU_ADDRESS_BASIC = 0x68;
const MPU_ADDRESS_ALTERNATIVE = 0x69


export enum AccelRange {
    RANGE_2G = 0,
    RANGE_4G = 1,
    RANGE_8G = 2,
    RANGE_16G = 3
}

/**
 * DPS == degrees per second
 */
export enum GyroRange {
    RANGE_250_DPS = 0,
    RANGE_500_DPS = 1,
    RANGE_1000_DPS = 2,
    RANGE_2000_DPS = 3
}

export class MPU6050 {
    private i2c: I2C;
    private i2cAddress: number
    private accelRange: AccelRange = AccelRange.RANGE_2G;
    private gyroRange: GyroRange = GyroRange.RANGE_250_DPS;

    /**
     *
     * @param i2c I2C object
     * @param alternativeAddress Whether the sensor is using the alternative i2c address
     */
    public constructor(i2c: I2C, alternativeAddress: boolean = false) {
        this.i2cAddress = alternativeAddress ? MPU_ADDRESS_ALTERNATIVE : MPU_ADDRESS_BASIC;
        this.i2c = i2c;
        this.fetchRanges();
    }

    private read16Bits(register: number) {
        const output = this.i2c.writeRead(this.i2cAddress, [register], 2)
        const result =  output[1] | (output[0] << 8);
        return result;
    }

    private read16BitsSigned(register: number): number {
        const value = this.read16Bits(register);
        return (value << 16) >> 16;
    }

    /**
     * Fetch ranges of gyro and accel measurements from the device and remember them for future measurements
     */
    public fetchRanges(): [AccelRange, GyroRange] {
        let accelCfg = this.i2c.writeRead(this.i2cAddress, Registers.ACCEL_CONFIG, 1)
        let accelVal = (accelCfg[0] >> 3) & 3;

        let gyroCfg = this.i2c.writeRead(this.i2cAddress, Registers.GYRO_CONFIG, 1)
        let gyroVal = (gyroCfg[0] >> 3) & 3;

        this.accelRange = accelVal
        this.gyroRange = gyroVal
        return [accelVal, gyroVal]
    }

    /**
     *
     * @returns Accelerometer range assumed by measurement calculations
     */
    public getAccelRange(): AccelRange {
        return this.accelRange
    }

    /**
     * Updates the range in the module and updates cached ranges
     * @param range Range of acceleration
     */
    public setAccelRange(range: AccelRange) {
        let accelCfg = this.i2c.writeRead(this.i2cAddress, Registers.ACCEL_CONFIG, 1)[0]
        accelCfg &= 0b11100111
        accelCfg |= range << 3
        this.i2c.writeTo(this.i2cAddress, [Registers.ACCEL_CONFIG, accelCfg])
        this.fetchRanges()
    }

    /**
     * Updates the range in the module and updates cached ranges
     * @param range Range of gyro
     */
    public setGyroRange(range: GyroRange) {
        let gyroCfg = this.i2c.writeRead(this.i2cAddress, Registers.ACCEL_CONFIG, 1)[0]
        gyroCfg &= 0b11100111
        gyroCfg |= range << 3
        this.i2c.writeTo(this.i2cAddress, [Registers.ACCEL_CONFIG, gyroCfg])
        this.fetchRanges()
    }

    /**
     *
     * @returns Gyro range assumed by measurement calculations
     */
    public getGyroRange(): GyroRange {
        return this.gyroRange;
    }

    /**
     *
     * @returns Temperature of the module in degrees celsius
     */
    private getRawTemperature(): number {
        return this.read16BitsSigned(Registers.TEMP_OUT_H);
    }

    /**
     *
     * @returns Temperature of the module in degrees celsius
     */
    public getTemperature(): number {
        const rdata = this.getRawTemperature();
        return (rdata / 340) + 36.54;
    }

    /**
     * @returns Raw acceleration values from the module
     */
    public fetchRawAccelereation(): [number, number, number] {
        return [
            this.read16BitsSigned(Registers.ACCEL_XOUT_H),
            this.read16BitsSigned(Registers.ACCEL_YOUT_H),
            this.read16BitsSigned(Registers.ACCEL_ZOUT_H)
        ]
    }

    /**
     *
     * @returns Acceleration in newtons per kilogram
     */
    public getAcceleration(): [number, number, number] {
        let [rawX, rawY, rawZ] = this.fetchRawAccelereation()
        let gMax = 0
        switch(this.accelRange) {
            case AccelRange.RANGE_2G:
                gMax = 2
                break;
            case AccelRange.RANGE_4G:
                gMax = 4
                break;
            case AccelRange.RANGE_8G:
                gMax = 8
                break;
            case AccelRange.RANGE_16G:
                gMax = 16
        }
        let coeff = gMax / 32768
        return [
            rawX * coeff,
            rawY * coeff,
            rawZ * coeff
        ]
    }

    /**
     *
     * @returns Raw angular velocity values from the module
     */
    public fetchRawAngularVelocity(): [number, number, number] {
        return [
            this.read16BitsSigned(Registers.GYRO_XOUT_H),
            this.read16BitsSigned(Registers.GYRO_YOUT_H),
            this.read16BitsSigned(Registers.GYRO_ZOUT_H)
        ]
    }

    /**
     *
     * @returns Angular velocity in degrees per second
     */
    public getAngularVelocity(): [number, number, number] {
        let [rawX, rawY, rawZ] = this.fetchRawAngularVelocity()
        let avMax = 0
        switch(this.gyroRange) {
            case GyroRange.RANGE_250_DPS:
                avMax = 250
                break;
            case GyroRange.RANGE_500_DPS:
                avMax = 500
                break;
            case GyroRange.RANGE_1000_DPS:
                avMax = 1000
                break;
            case GyroRange.RANGE_2000_DPS:
                avMax = 2000
        }
        let coeff = avMax / 32768
        return [
            rawX * coeff,
            rawY * coeff,
            rawZ * coeff
        ]
    }
}
