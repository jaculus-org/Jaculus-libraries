import * as i2c from "i2c";

const ADDR_BASE = 0b1001_000;

enum Reg {
  Conf = 0x01, // Configuration register
  Temp = 0x00, // Temperature register
  Tos = 0x03, // Overtemperature shutdown threshold
  Thyst = 0x02, // Hysteresis register
}

enum ConfMask {
  // reserved
  // reserved
  // reserved
  OS_F_QUE = 0b11 << 3, // Fault queue
  OS_POL = 0b1 << 2, // OS polarity
  OS_COMP_INT = 0b1 << 1, // OS operation mode
  SHUTDOWN = 0b1 << 0, // Device operation mode
}

export class LM75A {
  readonly bus: i2c.I2C;
  readonly addr: number;

  /**
   * Creates a new instance of the LM75A temperature sensor.
   * @param bus The I2C bus used for communication
   * @param addrBits Selects the I2C address (addr | (addrBits & 0b111))
   */
  constructor(bus: i2c.I2C, addrBits: number) {
    this.bus = bus;
    this.addr = ADDR_BASE | (addrBits & 0b111);
    this.init();
  }

  /**
   * Initializes the sensor
   */
  private init() {
    this.bus.writeTo(this.addr, [Reg.Conf, 0x00]);
  }

  /**
   * Reads the temperature in degrees Celsius.
   */
  readTemperature(): number {
    let value = this.bus.writeRead(this.addr, Reg.Temp, 2);
    let deg = ((value[1] | (value[0] << 8)) >> 5) / 8.0;
    if (value[0] & 0x80) {
      deg -= 256;
    }
    return deg;
  }
}
