/*
 * Copyright (c) 2013 Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission.
 * modified from Espruino's VL53L0X module (https://www.espruino.com/HD44780)
 */

import { I2C } from "i2c";

function getData(x: number, c?: number): number[] {
  var a = (x & 0xf0) | 8 | (c === undefined ? 1 : 0);
  var b = ((x << 4) & 0xf0) | 8 | (c === undefined ? 1 : 0);
  return [a, a, a | 4, a | 4, a, a, b, b, b | 4, b | 4, b, b];
}

export class HD44780 {
  private readonly addr: number;

  constructor(
    private readonly i2c: I2C,
    addr?: number,
  ) {
    this.addr = addr || 0x27;
    this.init();
  }

  private init() {
    this.write(0x33, 1);
    this.write(0x32, 1);
    this.write(0x28, 1);
    this.write(0x0c, 1);
    this.write(0x06, 1);
    this.write(0x01, 1);
  }

  private write(x: number, c?: number) {
    this.i2c.writeTo(this.addr, getData(x, c));
  }

  // clear screen
  public clear() {
    this.write(0x01, 1);
  }

  // print text
  public print(str: string) {
    let buffer: number[][] = [];
    for (var i = 0; i < str.length; i++)
      buffer.push(getData(str.charCodeAt(i)));
    this.i2c.writeTo(this.addr, buffer.flat());
  }

  // flashing block for the current cursor, or underline
  public cursor(block: boolean) {
    this.write(block ? 0x0f : 0x0e, 1);
  }

  // set cursor pos, top left = 0,0
  public setCursor(x: number, y: number) {
    var l = [0x00, 0x40, 0x14, 0x54];
    this.write(0x80 | (l[y] + x), 1);
  }

  // set special character 0..7, data is an array(8) of bytes, and then return to home addr
  public createChar(characterIndex: number, charData: number[]) {
    this.write(0x40 | ((characterIndex & 7) << 3), 1);
    for (var i = 0; i < 8; i++) this.write(charData[i]);
    this.write(0x80, 1);
  }
}
