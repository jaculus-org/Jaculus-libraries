import { SPI2 } from "spi";

interface SPIConfig {
    pin_ck: number;
    pin_cs: number;
    pin_d0: number;
    pin_d1: number;
    pin_d2: number;
    pin_d3: number;
    baud: number;
}

export interface DisplayConfig {
    width: number;
    height: number;
    rotation: number;
    spi: SPIConfig;
}

function setPixelByIndex(
    view: Uint8Array,
    i: number,
    r: number,
    g: number,
    b: number,
) {
    i *= 3;
    view[i] = r;
    view[i + 1] = g;
    view[i + 2] = b;
}

// TODO: implement other formats? (RGB_888 is currently hard-coded)

/**
 * The `Display` class holds a framebuffer and facilitates
 * communication with the Hub75 controller.
 */
export class Display {
    private _width: number;
    private _height: number;
    private _brightness: number;
    private _rotation: number;

    private _frame: ArrayBuffer;
    private view: Uint8Array;
    private sync: ArrayBuffer;
    private modeset: ArrayBuffer;
    private spi_pin_cs: number;

    constructor(config: DisplayConfig) {
        this._width = config.width;
        this._height = config.height;
        this._rotation = config.rotation;
        this._brightness = 0.5;
        this._frame = new ArrayBuffer(this.width * this.height * 3);
        this.view = new Uint8Array(this.frame);
        this.spi_pin_cs = config.spi.pin_cs;

        this.setupSPI(config.spi);
        this.sync = this.createSyncBuffer();
        this.modeset = this.createModesetBuffer();
    }

    /**
     * Modifies the color of a single pixel at (x, y).
     * This action only affects the framebuffer.
     * To submit the changes, use `Display.draw`.
     */
    setPixel(x: number, y: number, color: Rgb) {
        x = Math.round(x);
        y = Math.round(y);

        if (this._rotation === 1) {
            [x, y] = [y, this.height - 1 - x];
        } else if (this._rotation === -1) {
            [x, y] = [this.width - 1 - y, x];
        }

        const i = x + this.height * y;
        const r = (color & 0xff0000) >> 16;
        const g = (color & 0x00ff00) >> 8;
        const b = color & 0x0000ff;

        setPixelByIndex(this.view, i, r, g, b);
    }

    /**
     * Clears the framebuffer
     */
    clear() {
        this.view.fill(0);
    }

    /**
     * Fills the whole framebuffer with a solid color.
     * If you want to fill with black, use `Display.clear` for better performance.
     */
    fill(color: Rgb) {
        const r = (color & 0xff0000) >> 16;
        const g = (color & 0x00ff00) >> 8;
        const b = color & 0x0000ff;

        for (let i = 0; i < this.view.length / 3; i++)
            setPixelByIndex(this.view, i, r, g, b);
    }

    /**
     * Sends the framebuffer to the display
     */
    show() {
        const cs = this.spi_pin_cs;
        SPI2.transfer(this.sync, cs, 0, true);
        SPI2.transfer(this.modeset, cs, 0, true);
        SPI2.transfer(this.frame, cs, 0, true);
    }

    get rotation(): number {
        return this._rotation;
    }

    /**
     * The width of the display in pixels
     */
    get width(): number {
        return this._width;
    }
    /**
     * The height of the display in pixels
     */
    get height(): number {
        return this._height;
    }
    /**
     * The underlying framebuffer
     */
    get frame(): ArrayBuffer {
        return this._frame;
    }

    get brightness(): number {
        return this._brightness;
    }
    set brightness(value: number) {
        if (value < 0 || value > 1) throw new TypeError();

        this._brightness = value;
        this.modeset = this.createModesetBuffer();
    }

    private setupSPI(spi: SPIConfig) {
        SPI2.setup({
            sck: spi.pin_ck,
            data0: spi.pin_d0,
            data1: spi.pin_d1,
            data2: spi.pin_d2,
            data3: spi.pin_d3,
            baud: spi.baud,
            mode: 0,
            order: "lsb",
        });
    }

    private createSyncBuffer(): ArrayBuffer {
        return new Uint16Array([
            0xac92, 0x3bca, 0x41bf, 0x393d, 0xa74a, 0xae01, 0x155d, 0xfb70,
            0xf681, 0x2f6d, 0x4931, 0x0fa3, 0x77bf, 0xd756, 0x26f9, 0x4eb6,
        ]).buffer;
    }

    private createModesetBuffer(): ArrayBuffer {
        if (this.width >= 2 ** 16) throw new RangeError();

        let buffer = new ArrayBuffer(8);
        let view = new DataView(buffer);

        view.setUint16(0, 0xfb00);
        view.setUint8(2, 0x09);
        view.setUint8(3, Math.floor(255 * this.brightness));
        view.setUint16(4, this.width, true);

        return buffer;
    }
}
