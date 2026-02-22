import * as i2c from "i2c";
import { open as kvOpen } from "keyvalue";
import { scale, map } from "utils";
import { rgb } from "colors";
import { readInt16 } from "utils-i2c";

const ADDRESS_LOW = 0b1000_010;
const ADDRESS_HIGH = 0b1000_011;

enum Reg {
  Command = 0x80,
  DeviceId = 0x82,
  RevisionId = 0x83,
  RedChan = 0xa0,
  GreenChan = 0xa2,
  BlueChan = 0xa4,
  ClearChan = 0xa6,
  IRChan = 0xa8,
}

enum CmdMask {
  PON = 0b1 << 0, // Power on
  RGB_EN = 0b1 << 1, // RGB, clear, IR controller enable
  W_EN = 0b1 << 2, // Wait state enable
  // reserved
  DARK_EN = 0b1 << 4, // Dark offset cancelation enable
  // reserved
  RGB_TIME = 0b111 << 8, // Optical integration time
  W_TIME = 0b1 << 11, // Wait time
  AGAIN = 0b11 << 12, // Analog gain
  IRGAIN = 0b11 << 14, // IR gain
}

function setMasked(
  bus: i2c.I2C,
  address: number,
  reg: number,
  quantity: number,
  mask: number,
  value: number,
) {
  let data = bus.writeRead(address, reg, quantity);
  for (let i = 0; i < quantity; i++) {
    let maskByte = (mask >> (8 * i)) & 0xff;
    let valueByte = (value >> (8 * i)) & 0xff;
    data[i] = (data[i] & ~maskByte) | (valueByte & maskByte);
  }

  bus.writeTo(address, [reg, ...data]);
}

export type Calibration = {
  mins: number[];
  maxs: number[];
};

export class ZSCS2016C {
  readonly bus: i2c.I2C;
  private cal: Calibration = {
    mins: Array(5).fill(0),
    maxs: Array(5).fill(1),
  };
  private addr: number;

  /**
   * Creates a new instance of the ZSCS2016C color sensor.
   * @param bus The I2C bus used for communication
   * @param addrBit If true, uses address 0x43, otherwise 0x42
   */
  constructor(bus: i2c.I2C, addrBit: boolean) {
    this.bus = bus;
    this.addr = addrBit ? ADDRESS_HIGH : ADDRESS_LOW;
    this.init();
  }

  /**
   * Resets the sensor to its default state.
   */
  reset() {
    setMasked(this.bus, this.addr, Reg.Command, 2, 0xffff, 0);
  }

  /**
   * Initializes the sensor
   */
  init() {
    setMasked(
      this.bus,
      this.addr,
      Reg.Command,
      2,
      0xffff,
      CmdMask.PON | CmdMask.RGB_EN,
    );
  }

  /**
   * Reads value of the red channel and applies calibration.
   * @returns Scaled value of the red channel (0-1)
   */
  readRed(): number {
    let value = this.readRawRed();
    return scale(value, this.cal.mins[0], this.cal.maxs[0]);
  }

  /**
   * Reads value of the green channel and applies calibration.
   * @returns Scaled value of the green channel (0-1)
   */
  readGreen(): number {
    let value = this.readRawGreen();
    return scale(value, this.cal.mins[1], this.cal.maxs[1]);
  }

  /**
   * Reads value of the blue channel and applies calibration.
   * @returns Scaled value of the blue channel (0-1)
   */
  readBlue(): number {
    let value = this.readRawBlue();
    return scale(value, this.cal.mins[2], this.cal.maxs[2]);
  }

  /**
   * Reads value of the IR channel and applies calibration.
   * @returns Scaled value of the IR channel (0-1)
   */
  readIR(): number {
    let value = this.readRawIR();
    return scale(value, this.cal.mins[3], this.cal.maxs[3]);
  }

  /**
   * Reads value of the clear channel (unfiltered color) and applies calibration.
   * @returns Scaled value of the clear channel (0-1)
   */
  readClear(): number {
    let value = this.readRawClear();
    return scale(value, this.cal.mins[4], this.cal.maxs[4]);
  }

  /**
   * Reads values of all RGB channels and applies calibration.
   * @note This method is more efficient and accurate than reading all channels individually.
   * @returns Array of scaled RGB values [R, G, B] (0-1)
   */
  readRgb(): Rgb {
    let value = this.readRawRgb();
    return rgb(
      map(value[0], this.cal.mins[0], this.cal.maxs[0], 0, 255),
      map(value[1], this.cal.mins[1], this.cal.maxs[1], 0, 255),
      map(value[2], this.cal.mins[2], this.cal.maxs[2], 0, 255),
    );
  }

  /**
   * Reads raw value of the red channel.
   * @returns Raw value of the red channel
   */
  readRawRed(): number {
    return readInt16(this.bus, this.addr, Reg.RedChan);
  }

  /**
   * Reads raw value of the green channel.
   * @returns Raw value of the green channel
   */
  readRawGreen(): number {
    return readInt16(this.bus, this.addr, Reg.GreenChan);
  }

  /**
   * Reads raw value of the blue channel.
   * @returns Raw value of the blue channel
   */
  readRawBlue(): number {
    return readInt16(this.bus, this.addr, Reg.BlueChan);
  }

  /**
   * Reads raw value of the IR channel.
   * @returns Raw value of the IR channel
   */
  readRawIR(): number {
    return readInt16(this.bus, this.addr, Reg.IRChan);
  }

  /**
   * Reads raw value of the clear channel (unfiltered color).
   * @returns Raw value of the clear channel
   */
  readRawClear(): number {
    return readInt16(this.bus, this.addr, Reg.ClearChan);
  }

  /**
   * Reads raw values of all RGB channels.
   * @note This method is more efficient and accurate than reading all channels individually.
   * @returns Array of raw RGB values [R, G, B]
   */
  readRawRgb(): [number, number, number] {
    let value = this.bus.writeRead(this.addr, Reg.RedChan, 6);
    return [
      value[0] | (value[1] << 8),
      value[2] | (value[3] << 8),
      value[4] | (value[5] << 8),
    ];
  }

  /**
   * Runs a calibration procedure for the sensor. During the calibration, the sensor
   * should be placed on a white and a black surface. The resulting calibration
   * depends on the distance from the surface and lighting conditions.
   */
  async runCalibration(): Promise<void> {
    let mins = Array(5).fill(Infinity);
    let maxs = Array(5).fill(0);
    let funs = [
      "readRawRed",
      "readRawGreen",
      "readRawBlue",
      "readRawIR",
      "readRawClear",
    ] as const;

    console.log("Place on white...");
    await sleep(3000);
    console.log("measuring...");
    for (let i = 0; i < 30; i++) {
      for (let i = 0; i < funs.length; i++) {
        let value = this[funs[i]]();
        maxs[i] = Math.max(maxs[i], value);
      }
      await sleep(10);
    }

    console.log("Place on black...");
    await sleep(3000);
    console.log("measuring...");
    for (let i = 0; i < 30; i++) {
      for (let i = 0; i < funs.length; i++) {
        let value = this[funs[i]]();
        mins[i] = Math.min(mins[i], value);
      }
      await sleep(10);
    }
    console.log("Calibration done");

    this.cal = {
      mins: mins,
      maxs: maxs,
    };
  }

  /**
   * Returns the current calibration data.
   * @throws Error if calibration is not set
   * @returns The current calibration data
   */
  getCalibration(): Calibration {
    if (!this.cal) {
      throw new Error("Calibration not set");
    }
    return this.cal;
  }

  /**
   * Sets the calibration data.
   * @param cal The calibration data to set
   */
  setCalibration(cal: Calibration) {
    this.cal = cal;
  }

  /**
   * Saves the current calibration data to persistent storage.
   * @param id Identifier for the calibration data
   */
  saveCalibration(id: string) {
    const kv = kvOpen("ZSCS2016C_calib");
    kv.set(id, JSON.stringify(this.cal));
    kv.commit();
  }

  /**
   * Loads calibration data from persistent storage.
   * @param id Identifier for the calibration data
   */
  loadCalibration(id: string) {
    const kv = kvOpen("ZSCS2016C_calib");
    const data = kv.getString(id);
    if (!data) {
      throw new Error(`Calibration with id ${id} not found`);
    }
    this.cal = JSON.parse(data);
  }
}
