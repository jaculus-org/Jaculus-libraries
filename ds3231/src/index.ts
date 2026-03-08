import { I2C } from "i2c";

const DEFAULT_ADDRESS = 0x68;

enum Reg {
  Seconds = 0x00,
  Minutes = 0x01,
  Hours = 0x02,
  Day = 0x03,
  Date = 0x04,
  Month = 0x05,
  Year = 0x06,
  TempMsb = 0x11,
  TempLsb = 0x12,
}

export type DateTime = {
  year: number;
  month: number;
  date: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function bcdToDec(value: number): number {
  return (value >> 4) * 10 + (value & 0x0f);
}

function decToBcd(value: number): number {
  let v = Math.floor(value);
  return ((Math.floor(v / 10) << 4) | (v % 10)) & 0xff;
}

function decodeHours(value: number): number {
  if (value & 0x40) {
    let hour = bcdToDec(value & 0x1f);
    if (value & 0x20) {
      hour = (hour % 12) + 12;
    }
    return hour;
  }
  return bcdToDec(value & 0x3f);
}

function encodeHours(hours: number): number {
  return decToBcd(hours) & 0x3f;
}

export class DS3231 {
  readonly bus: I2C;
  readonly addr: number;

  /**
   * Creates a new instance of the DS3231 RTC.
   * @param bus The I2C bus used for communication
   * @param address Optional I2C address (default 0x68)
   */
  constructor(bus: I2C, address: number = DEFAULT_ADDRESS) {
    this.bus = bus;
    this.addr = address;
  }

  /**
   * Reads date and time from the RTC.
   * @returns Current date and time from the DS3231
   */
  readTime(): DateTime {
    let data = this.bus.writeRead(this.addr, Reg.Seconds, 7);

    let seconds = bcdToDec(data[0] & 0x7f);
    let minutes = bcdToDec(data[1] & 0x7f);
    let hours = decodeHours(data[2]);
    let day = bcdToDec(data[3] & 0x07);
    let date = bcdToDec(data[4] & 0x3f);

    let monthRaw = data[5];
    let month = bcdToDec(monthRaw & 0x1f);
    let year = bcdToDec(data[6]);
    if (monthRaw & 0x80) {
      year += 100;
    }

    return {
      year: 2000 + year,
      month,
      date,
      day,
      hours,
      minutes,
      seconds,
    };
  }

  /**
   * Sets date and time on the RTC.
   * @param time Date and time to set (year 2000-2199 recommended)
   */
  setTime(time: DateTime) {
    let year = time.year;
    if (year < 2000 || year > 2199) {
      throw new Error("Year must be in range 2000-2199");
    }

    let century = year >= 2100 ? 0x80 : 0x00;
    let yearTwo = year % 100;

    this.bus.writeTo(this.addr, [
      Reg.Seconds,
      decToBcd(time.seconds) & 0x7f,
      decToBcd(time.minutes) & 0x7f,
      encodeHours(time.hours),
      decToBcd(time.day),
      decToBcd(time.date),
      decToBcd(time.month) | century,
      decToBcd(yearTwo),
    ]);
  }

  /**
   * Reads temperature in degrees Celsius from the DS3231.
   */
  readTemperature(): number {
    let data = this.bus.writeRead(this.addr, Reg.TempMsb, 2);
    let msb = data[0];
    if (msb & 0x80) {
      msb -= 256;
    }
    let frac = (data[1] >> 6) * 0.25;
    return msb + frac;
  }
}
