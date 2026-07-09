import { SPI2 } from "spi";

interface SPIConfig {
    pin_ck: number,
    pin_cs: number,
    pin_d0: number,
    pin_d1: number,
    pin_d2: number,
    pin_d3: number,
    baud:   number,
}

export interface DisplayConfig {
    width?: number,
    height?: number,
    buffer?: ArrayBuffer,
    spi?: SPIConfig
}

// TODO: implement other formats? (RGB_888 is currently hard-coded)
/**
 * The `Display` class holds a framebuffer and facilitates
 * communication with the Hub75 controller.
 */
export class Display {
    private _width:     number;
    private _height:    number;
    private frame:      ArrayBuffer;
    private view:       Uint8Array;
    private sync:       ArrayBuffer;
    private modeset:    ArrayBuffer;
    private spi_pin_cs: number;

    static DEFAULT_CONFIG: Required<DisplayConfig> = {
        width:  64,
        height: 64,
        buffer: new ArrayBuffer(64 * 64 * 3),
        spi: {
            pin_ck: 3,
            pin_cs: 1,
            pin_d0: 38,
            pin_d1: 39,
            pin_d2: 41,
            pin_d3: 45,
            baud:   2_000_000,
        }
    };

    constructor(config?: DisplayConfig) {
        const resolved = { ...Display.DEFAULT_CONFIG, ...config };
        if (resolved.buffer.byteLength != resolved.width * resolved.height * 3)
            throw new TypeError();

        this._width     = resolved.width;
        this._height    = resolved.height;
        this.frame      = resolved.buffer;
        this.view       = new Uint8Array(this.frame);
        this.spi_pin_cs = resolved.spi.pin_cs;

        this.setupSPI(resolved.spi);
        this.sync    = this.createSyncBuffer();
        this.modeset = this.createModesetBuffer();
    }

    draw() {
        SPI2.transfer(this.sync, this.spi_pin_cs, 0, true);
        SPI2.transfer(this.modeset, this.spi_pin_cs, 0, true);
        SPI2.transfer(this.frame, this.spi_pin_cs, 0, true);
    }

    /**
     * Modifies the color of a single pixel at (x, y).
     * This action only affects the framebuffer.
     * To submit the changes, use `Display.draw`.
     */
    setPixel(x: number, y: number, color: Rgb) {
        const i = (y + this.height * x);
        this.setPixelByIndex(i, color);
    }

    fill(color: Rgb) {
        for (let i = 0; i < this.view.length / 3; i++)
            this.setPixelByIndex(i, color);
    }

    get width(): number { return this._width; }
    get height(): number { return this._height; }

    private setupSPI(spi: SPIConfig) {
        SPI2.setup({
            sck:   spi.pin_ck,
            data0: spi.pin_d0,
            data1: spi.pin_d1,
            data2: spi.pin_d2,
            data3: spi.pin_d3,
            baud:  spi.baud,
            mode:  0,
            order: "lsb"
        });
    }

    private setPixelByIndex(i: number, color: Rgb) {
        this.view[3 * i + 0] = (color & 0xff0000) >> 16;
        this.view[3 * i + 1] = (color & 0x00ff00) >> 8;
        this.view[3 * i + 2] = (color & 0x0000ff) >> 0;
    }

    private createSyncBuffer(): ArrayBuffer {
        return new Uint16Array([
            0xac92, 0x3bca, 0x41bf, 0x393d,
            0xa74a, 0xae01, 0x155d, 0xfb70,
            0xf681, 0x2f6d, 0x4931, 0x0fa3,
            0x77bf, 0xd756, 0x26f9, 0x4eb6,
        ]).buffer;
    }

    private createModesetBuffer(): ArrayBuffer {
        if (this.width >= 2**16)
            throw new RangeError();

        return new Uint16Array([
            0x00fb, 0xff09, this.width, 0x0000
        ]).buffer;
    }
}
