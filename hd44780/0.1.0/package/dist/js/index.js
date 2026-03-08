/*
 * Copyright (c) 2013 Gordon Williams, Pur3 Ltd. See the file LICENSE for copying permission.
 * modified from Espruino's VL53L0X module (https://www.espruino.com/HD44780)
 */
function getData(x, c) {
    var a = (x & 0xf0) | 8 | (c === undefined ? 1 : 0);
    var b = ((x << 4) & 0xf0) | 8 | (c === undefined ? 1 : 0);
    return [a, a, a | 4, a | 4, a, a, b, b, b | 4, b | 4, b, b];
}
export class HD44780 {
    i2c;
    addr;
    constructor(i2c, addr) {
        this.i2c = i2c;
        this.addr = addr || 0x27;
        this.init();
    }
    init() {
        this.write(0x33, 1);
        this.write(0x32, 1);
        this.write(0x28, 1);
        this.write(0x0c, 1);
        this.write(0x06, 1);
        this.write(0x01, 1);
    }
    write(x, c) {
        this.i2c.writeTo(this.addr, getData(x, c));
    }
    // clear screen
    clear() {
        this.write(0x01, 1);
    }
    // print text
    print(str) {
        let buffer = [];
        for (var i = 0; i < str.length; i++)
            buffer.push(getData(str.charCodeAt(i)));
        this.i2c.writeTo(this.addr, buffer.flat());
    }
    // flashing block for the current cursor, or underline
    cursor(block) {
        this.write(block ? 0x0f : 0x0e, 1);
    }
    // set cursor pos, top left = 0,0
    setCursor(x, y) {
        var l = [0x00, 0x40, 0x14, 0x54];
        this.write(0x80 | (l[y] + x), 1);
    }
    // set special character 0..7, data is an array(8) of bytes, and then return to home addr
    createChar(characterIndex, charData) {
        this.write(0x40 | ((characterIndex & 7) << 3), 1);
        for (var i = 0; i < 8; i++)
            this.write(charData[i]);
        this.write(0x80, 1);
    }
}
