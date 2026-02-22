import * as i2c from "i2c";

const ADDRESS = 0x6a;

export class BQ2589 {
  readonly bus: i2c.I2C;

  constructor(bus: i2c.I2C) {
    this.bus = bus;
  }

  private setBit(address: number, reg: number, bit: number, value: boolean) {
    this.bus.writeTo(address, reg);
    let data = this.bus.readFrom(address, 1)[0];
    data = value ? data | (1 << bit) : data & ~(1 << bit);
    this.bus.writeTo(address, [reg, data]);
  }

  startADCContinuous() {
    this.setBit(ADDRESS, 2, 6, true);
  }

  startADCOneshot() {
    this.setBit(ADDRESS, 2, 7, true);
  }

  readADC() {
    this.bus.writeTo(ADDRESS, 0x0f);
    let value = this.bus.readFrom(ADDRESS, 1)[0];
    return (value * 20 + 2304) / 1000;
  }

  resetWatchdog() {
    this.setBit(ADDRESS, 3, 6, true);
  }

  async readADCOneshot(): Promise<number> {
    this.startADCOneshot();
    await sleep(50);
    return this.readADC();
  }
}
