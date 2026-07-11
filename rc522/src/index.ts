import { SPI } from "spi";

// Based on original work by Gordon Williams, Pur3 Ltd.

const BLOCK_SIZE = 16;
const MAX_MIFARE_CLASSIC_BLOCK = 63;
const TEXT_RECORD_HEADER_SIZE = 2;

// ── Register map ────────────────────────────────────────────────────────────

enum Reg {
    Command = 0x01 << 1,
    ComIEn = 0x02 << 1,
    DivIEn = 0x03 << 1,
    ComIrq = 0x04 << 1,
    DivIrq = 0x05 << 1,
    Error = 0x06 << 1,
    Status2 = 0x08 << 1,
    FifoData = 0x09 << 1,
    FifoLevel = 0x0a << 1,
    BitFraming = 0x0d << 1,
    Collision = 0x0e << 1,
    TxMode = 0x12 << 1,
    RxMode = 0x13 << 1,
    TxControl = 0x14 << 1,
    TxAuto = 0x15 << 1,
    Mode = 0x2a << 1,
    Prescaler = 0x2b << 1,
    ReloadH = 0x2c << 1,
    ReloadL = 0x2d << 1,
    Version = 0x37 << 1,
}

// ── PICC (card) commands ─────────────────────────────────────────────────────

const PICC = {
    REQA: 0x26,
    WUPA: 0x52,
    SELECT1: 0x93,
    SELECT2: 0x95,
    SELECT3: 0x97,
    HALT: 0x50,
    AUTH_KEY_A: 0x60,
    AUTH_KEY_B: 0x61,
    READ: 0x30,
    WRITE: 0xa0,
} as const;

// ── PCD (reader) commands ────────────────────────────────────────────────────

const PCD = {
    IDLE: 0x00,
    AUTHENT: 0x0e,
    TRANSCEIVE: 0x0c,
} as const;

// ── Public types ─────────────────────────────────────────────────────────────

/** UID of a detected card (1–10 bytes). */
export type CardUID = Uint8Array;

/** Which key to use for sector authentication. */
export type KeyType = "A" | "B";

/** Default MIFARE factory key (all 0xFF). */
export const DEFAULT_KEY: number[] = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

// ── Main Factory class ─────────────────────────────────────────────────────────

/**
 * Create and initialise an RC522 instance.
 * Driver for the RC522 RFID reader/writer module (SPI interface).
 *
 * @param spi SPI bus (e.g. `SPI1`).
 * @param cs  Chip-select (NSS) pin number.
 * @returns   Initialised `RC522` instance.
 *
 * @example
 * ```ts
 * import { RC522, DEFAULT_KEY, CardUID } from "rc522";
 * import { SPI2 } from "spi";
 *
 * SPI2.setup({
 *     sck: 4,
 *     mosi: 15,
 *     miso: 5,
 *     baud: 100000,
 *     mode: 0,
 *     order: "msb",
 * });
 *
 * const rfid = new RC522(SPI2, 16);
 *
 * rfid.onCard(async (uid) => {
 *     console.log("Card detected with UID: " + rfid.uidToString(uid));
 * 	await rfid.authenticate(uid, 4, "A", DEFAULT_KEY);
 *
 * 	await rfid.writeTextRecord(4, "Ahoj tabor! Zdraví Honza a Kuba.");
 * 	const message = await rfid.readTextRecord(4);
 *
 * 	console.log(message);
 * 	await rfid.haltCard();
 * 	rfid.stopCrypto();
 * });
 *
 * rfid.startPolling(500);
 * ```
 */

export class RC522 {
    private _onCard: ((uid: CardUID) => void | Promise<void>) | null = null;
    private _pollInterval: number | null = null;
    private _lastUID: string = "";

    constructor(
        readonly spi: SPI,
        readonly cs: number,
    ) {
        this.init();
    }

    // ── Low-level register I/O ───────────────────────────────────────────────

    private regRead(addr: number): number {
        return this.spi.transfer([addr | 0x80, 0], this.cs, 2, false)[1];
    }

    private regReadMany(addr: number, count: number): Uint8Array {
        const buf = new Uint8Array(count + 1);
        buf.fill(addr | 0x80);
        buf[count] = 0;
        return this.spi.send(buf, this.cs).slice(1);
    }

    private regWrite(addr: number, data: number | number[]): void {
        if (typeof data === "number") data = [data];
        this.spi.write([addr, ...data], this.cs);
    }

    private regSet(addr: number, mask: number): void {
        this.regWrite(addr, this.regRead(addr) | mask);
    }

    private regClear(addr: number, mask: number): void {
        this.regWrite(addr, this.regRead(addr) & ~mask);
    }

    private encodeUtf8(text: string): Uint8Array {
        const bytes: number[] = [];

        for (let i = 0; i < text.length; i++) {
            let codePoint = text.charCodeAt(i);

            if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
                const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
                if (next >= 0xdc00 && next <= 0xdfff) {
                    codePoint =
                        0x10000 +
                        ((codePoint - 0xd800) << 10) +
                        (next - 0xdc00);
                    i++;
                } else {
                    codePoint = 0xfffd;
                }
            } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
                codePoint = 0xfffd;
            }

            if (codePoint <= 0x7f) {
                bytes.push(codePoint);
            } else if (codePoint <= 0x7ff) {
                bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
            } else if (codePoint <= 0xffff) {
                bytes.push(
                    0xe0 | (codePoint >> 12),
                    0x80 | ((codePoint >> 6) & 0x3f),
                    0x80 | (codePoint & 0x3f),
                );
            } else {
                bytes.push(
                    0xf0 | (codePoint >> 18),
                    0x80 | ((codePoint >> 12) & 0x3f),
                    0x80 | ((codePoint >> 6) & 0x3f),
                    0x80 | (codePoint & 0x3f),
                );
            }
        }

        return new Uint8Array(bytes);
    }

    private decodeUtf8(bytes: Uint8Array): string {
        const replacement = String.fromCharCode(0xfffd);
        let text = "";

        for (let i = 0; i < bytes.length; i++) {
            const byte1 = bytes[i];

            if (byte1 < 0x80) {
                text += String.fromCharCode(byte1);
                continue;
            }

            if ((byte1 & 0xe0) === 0xc0) {
                if (i + 1 >= bytes.length) {
                    text += replacement;
                    break;
                }
                const byte2 = bytes[i + 1];
                if ((byte2 & 0xc0) !== 0x80) {
                    text += replacement;
                    continue;
                }
                const codePoint = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
                if (codePoint < 0x80) {
                    text += replacement;
                    continue;
                }
                text += String.fromCharCode(codePoint);
                i += 1;
                continue;
            }

            if ((byte1 & 0xf0) === 0xe0) {
                if (i + 2 >= bytes.length) {
                    text += replacement;
                    break;
                }
                const byte2 = bytes[i + 1];
                const byte3 = bytes[i + 2];
                if ((byte2 & 0xc0) !== 0x80 || (byte3 & 0xc0) !== 0x80) {
                    text += replacement;
                    continue;
                }
                const codePoint =
                    ((byte1 & 0x0f) << 12) |
                    ((byte2 & 0x3f) << 6) |
                    (byte3 & 0x3f);
                if (
                    codePoint < 0x800 ||
                    (codePoint >= 0xd800 && codePoint <= 0xdfff)
                ) {
                    text += replacement;
                    continue;
                }
                text += String.fromCharCode(codePoint);
                i += 2;
                continue;
            }

            if ((byte1 & 0xf8) === 0xf0) {
                if (i + 3 >= bytes.length) {
                    text += replacement;
                    break;
                }
                const byte2 = bytes[i + 1];
                const byte3 = bytes[i + 2];
                const byte4 = bytes[i + 3];
                if (
                    (byte2 & 0xc0) !== 0x80 ||
                    (byte3 & 0xc0) !== 0x80 ||
                    (byte4 & 0xc0) !== 0x80
                ) {
                    text += replacement;
                    continue;
                }
                const codePoint =
                    ((byte1 & 0x07) << 18) |
                    ((byte2 & 0x3f) << 12) |
                    ((byte3 & 0x3f) << 6) |
                    (byte4 & 0x3f);
                if (codePoint < 0x10000 || codePoint > 0x10ffff) {
                    text += replacement;
                    continue;
                }
                const adjusted = codePoint - 0x10000;
                text += String.fromCharCode(
                    0xd800 | (adjusted >> 10),
                    0xdc00 | (adjusted & 0x3ff),
                );
                i += 3;
                continue;
            }

            text += replacement;
        }

        return text;
    }

    // ── Initialisation ───────────────────────────────────────────────────────

    private init(): void {
        this.regWrite(Reg.Mode, 0x3d); // CRC preset 0x6363, polarity
        this.regWrite(Reg.TxAuto, 0x40); // force 100% ASK modulation
        // Timer: auto-start after TX, ~25 ms timeout
        // TPrescaler = 0xA9 → f_timer = 13.56 MHz / (2 * (0xA9 + 1)) = ~40 kHz
        // TReload = 0x03E8 = 1000 → timeout = 1000 / 40 kHz ≈ 25 ms
        this.regWrite(Reg.Mode, 0x3d);
        this.regWrite(Reg.Prescaler, 0xa9);
        this.regWrite(Reg.ReloadH, 0x03);
        this.regWrite(Reg.ReloadL, 0xe8);
        this.antennaOn(true);
    }

    /**
     * Turn the antenna on or off.
     * @param on `true` to enable, `false` to disable.
     */
    antennaOn(on: boolean): void {
        if (on) {
            this.regSet(Reg.TxControl, 0x03);
        } else {
            this.regClear(Reg.TxControl, 0x03);
        }
    }

    /**
     * Read the chip version register.
     * @returns Version byte (0x91 = v1, 0x92 = v2).
     */
    getVersion(): number {
        return this.regRead(Reg.Version);
    }

    // ── Core transceive ──────────────────────────────────────────────────────

    private async transceive(
        data: number[],
        crc: boolean = false,
    ): Promise<Uint8Array> {
        // Enable/disable CRC in TX and RX
        if (crc) {
            this.regSet(Reg.TxMode, 0x80);
            this.regSet(Reg.RxMode, 0x80);
        } else {
            this.regClear(Reg.TxMode, 0x80);
            this.regClear(Reg.RxMode, 0x80);
        }

        this.regWrite(Reg.Command, PCD.IDLE);
        this.regWrite(Reg.ComIrq, 0x7f); // clear all IRQ flags
        this.regWrite(Reg.FifoLevel, 0x80); // flush FIFO
        this.regWrite(Reg.FifoData, data);
        this.regWrite(Reg.Command, PCD.TRANSCEIVE);
        this.regSet(Reg.BitFraming, 0x80); // start TX

        // Poll for RxIrq (bit 5), IdleIrq (bit 4), or TimerIrq (bit 0)
        let irq = 0;
        for (let i = 0; i < 50; i++) {
            irq = this.regRead(Reg.ComIrq);
            if (irq & 0x31) break;
            await sleep(1);
        }

        this.regClear(Reg.BitFraming, 0x80); // stop TX

        if (!(irq & 0x30)) {
            throw new Error("RC522 transceive timeout");
        }

        const err = this.regRead(Reg.Error);
        if (err & 0x13) {
            throw new Error(`RC522 transceive error: 0x${err.toString(16)}`);
        }

        const fifo = this.regRead(Reg.FifoLevel);
        if (fifo === 0) {
            throw new Error("RC522 transceive: empty FIFO");
        }
        return this.regReadMany(Reg.FifoData, fifo);
    }

    // ── Card detection ───────────────────────────────────────────────────────

    /**
     * Check whether a card is present in the field.
     * @returns `true` if a card responded to REQA.
     */
    async isCardPresent(): Promise<boolean> {
        this.regWrite(Reg.BitFraming, 0x07); // 7 bits in last byte
        try {
            return (await this.transceive([PICC.REQA], false)).length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Read the UID of the card currently in the field.
     * Must call `isCardPresent()` first.
     * @returns UID bytes (4 bytes for most MIFARE cards), or empty array if failed.
     */
    async readUID(): Promise<Uint8Array> {
        this.regWrite(Reg.BitFraming, 0x00);
        try {
            // Anti-collision: no CRC
            const r = await this.transceive([PICC.SELECT1, 0x20], false);
            if (r.length >= 5) return r.slice(0, 4);
        } catch {
            // fall through
        }
        return new Uint8Array(0);
    }

    /**
     * Format a UID as a hex string (e.g. `"A1:B2:C3:D4"`).
     */
    uidToString(uid: CardUID): string {
        let s = "";
        for (let i = 0; i < uid.length; i++) {
            const b = uid[i];
            s += (b < 0x10 ? "0" : "") + b.toString(16).toUpperCase();
            if (i < uid.length - 1) {
                s += ":";
            }
        }
        return s;
    }

    // ── Halt ─────────────────────────────────────────────────────────────────

    /**
     * Send HALT command to put the card into sleep state.
     */
    async haltCard(): Promise<void> {
        try {
            // HALT requires CRC
            await this.transceive([PICC.HALT, 0x00], true);
        } catch {
            // HALT does not return a response – ignore errors
        }
    }

    // ── Authentication ───────────────────────────────────────────────────────

    /**
     * Authenticate a sector before reading or writing.
     * Must be called before `readBlock()` / `writeBlock()` for protected sectors.
     *
     * @param uid     UID of the card (from `readUID()`).
     * @param block   Any block number within the target sector.
     * @param keyType `"A"` or `"B"`.
     * @param key     6-byte key array (default: all 0xFF).
     */
    async authenticate(
        uid: CardUID,
        block: number,
        keyType: KeyType,
        key: number[] = DEFAULT_KEY,
    ): Promise<void> {
        const cmd = keyType === "A" ? PICC.AUTH_KEY_A : PICC.AUTH_KEY_B;
        const payload = [cmd, block, ...key, ...Array.from(uid)];

        this.regWrite(Reg.Command, PCD.IDLE);
        this.regWrite(Reg.ComIrq, 0x7f);
        this.regWrite(Reg.FifoLevel, 0x80);
        this.regWrite(Reg.FifoData, payload);
        this.regWrite(Reg.Command, PCD.AUTHENT);

        // Poll for IdleIrq (bit 4) or TimerIrq (bit 0)
        let irq = 0;
        for (let i = 0; i < 50; i++) {
            irq = this.regRead(Reg.ComIrq);
            if (irq & 0x11) break;
            await sleep(1);
        }

        // MFCrypto1On (bit 3) in Status2Reg
        if (!(this.regRead(Reg.Status2) & 0x08)) {
            throw new Error(
                "RC522 authentication failed (MFCrypto1On not set)",
            );
        }
    }

    /**
     * Stop the crypto engine (call after you are done with a card session).
     */
    stopCrypto(): void {
        this.regClear(Reg.Status2, 0x08); // clear MFCrypto1On
    }

    // ── Block read / write ───────────────────────────────────────────────────

    /**
     * Read a 16-byte block from the card.
     * Requires prior `authenticate()` for protected sectors.
     *
     * @param block Block number (0–63 for MIFARE Classic 1K).
     * @returns 16-byte data block.
     */
    async readBlock(block: number): Promise<Uint8Array> {
        // READ requires CRC in both directions
        const resp = await this.transceive([PICC.READ, block], true);
        if (resp.length < 1) {
            throw new Error(
                `RC522 readBlock: short response (${resp.length} bytes)`,
            );
        }
        return resp.slice(0, 16);
    }

    /**
     * Write a 16-byte block to the card.
     * Requires prior `authenticate()` for protected sectors.
     *
     * @param block Block number (0–63 for MIFARE Classic 1K).
     * @param data  Exactly 16 bytes to write.
     */
    async writeBlock(
        block: number,
        data: number[] | Uint8Array,
    ): Promise<void> {
        if (data.length !== 16) {
            throw new Error("writeBlock: data must be exactly 16 bytes");
        }
        // Both phases require CRC
        await this.transceive([PICC.WRITE, block], true);
        await this.transceive(Array.from(data), true);
    }

    // ── Convenience helpers ──────────────────────────────────────────────────

    /**
     * Read a text string stored in a block (strips trailing null bytes).
     *
     * @param block Block number.
     * @returns UTF-8 decoded string.
     */
    async readBlockText(block: number): Promise<string> {
        const raw = await this.readBlock(block);
        let end = raw.length;
        while (end > 0 && raw[end - 1] === 0) end--;
        return this.decodeUtf8(raw.slice(0, end));
    }

    /**
     * Write a text string into a block (padded with null bytes to 16 bytes).
     *
     * @param block Block number.
     * @param text  String to write (max 16 ASCII characters).
     */
    async writeBlockText(block: number, text: string): Promise<void> {
        const encoded = this.encodeUtf8(text);
        if (encoded.length > BLOCK_SIZE) {
            throw new Error("writeBlockText: text must fit into 16 bytes");
        }

        const buf = new Uint8Array(BLOCK_SIZE);
        buf.set(encoded);
        await this.writeBlock(block, buf);
    }

    /**
     * Read a text record stored across consecutive blocks.
     * The record starts with a 2-byte big-endian length header followed by UTF-8 text.
     *
     * @param startBlock First data block of the record.
     * @returns UTF-8 decoded text.
     */
    async readTextRecord(startBlock: number): Promise<string> {
        const header = await this.readBlock(startBlock);
        const textLength = (header[0] << 8) | header[1];
        const totalBytes = TEXT_RECORD_HEADER_SIZE + textLength;
        const blockCount = Math.ceil(totalBytes / BLOCK_SIZE);

        if (startBlock + blockCount - 1 > MAX_MIFARE_CLASSIC_BLOCK) {
            throw new Error(
                "readTextRecord: record exceeds supported card size",
            );
        }

        const record = new Uint8Array(blockCount * BLOCK_SIZE);
        record.set(header, 0);

        for (let i = 1; i < blockCount; i++) {
            record.set(await this.readBlock(startBlock + i), i * BLOCK_SIZE);
        }

        return this.decodeUtf8(
            record.slice(
                TEXT_RECORD_HEADER_SIZE,
                TEXT_RECORD_HEADER_SIZE + textLength,
            ),
        );
    }

    /**
     * Write a text record across consecutive blocks.
     * The record starts with a 2-byte big-endian length header followed by UTF-8 text.
     *
     * @param startBlock First data block of the record.
     * @param text Text to store.
     */
    async writeTextRecord(startBlock: number, text: string): Promise<void> {
        const payload = this.encodeUtf8(text);
        if (payload.length > 0xffff) {
            throw new Error("writeTextRecord: text is too long");
        }

        const totalBytes = TEXT_RECORD_HEADER_SIZE + payload.length;
        const blockCount = Math.ceil(totalBytes / BLOCK_SIZE);

        if (startBlock + blockCount - 1 > MAX_MIFARE_CLASSIC_BLOCK) {
            throw new Error(
                "writeTextRecord: record exceeds supported card size",
            );
        }

        const record = new Uint8Array(blockCount * BLOCK_SIZE);
        record[0] = (payload.length >>> 8) & 0xff;
        record[1] = payload.length & 0xff;
        record.set(payload, TEXT_RECORD_HEADER_SIZE);

        for (let i = 0; i < blockCount; i++) {
            const offset = i * BLOCK_SIZE;
            await this.writeBlock(
                startBlock + i,
                record.slice(offset, offset + BLOCK_SIZE),
            );
        }
    }

    /**
     * Read a 32-bit unsigned integer stored in the first 4 bytes of a block.
     *
     * @param block Block number.
     */
    async readBlockUint32(block: number): Promise<number> {
        const d = await this.readBlock(block);
        return ((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0;
    }

    /**
     * Write a 32-bit unsigned integer into the first 4 bytes of a block
     * (remaining 12 bytes are set to 0).
     *
     * @param block Block number.
     * @param value 32-bit unsigned integer.
     */
    async writeBlockUint32(block: number, value: number): Promise<void> {
        const buf = new Array<number>(16).fill(0);
        buf[0] = (value >>> 24) & 0xff;
        buf[1] = (value >>> 16) & 0xff;
        buf[2] = (value >>> 8) & 0xff;
        buf[3] = value & 0xff;
        await this.writeBlock(block, buf);
    }

    // ── Event-based polling ──────────────────────────────────────────────────

    /**
     * Register a callback that fires whenever a new card is detected.
     * The same card will not trigger the callback again until it is removed
     * and re-presented.
     *
     * @param callback Function called with the card UID. May be async.
     */
    onCard(callback: (uid: CardUID) => void | Promise<void>): void {
        this._onCard = callback;
    }

    /**
     * Start polling for cards at the given interval.
     * Polling is sequential – the next poll starts only after the previous
     * one (including any async `onCard` callback) has finished.
     *
     * @param intervalMs Polling interval in milliseconds (default 200 ms).
     */
    startPolling(intervalMs: number = 200): void {
        if (this._pollInterval !== null) return;
        const loop = async () => {
            await this._poll();
            this._pollInterval = setTimeout(
                loop,
                intervalMs,
            ) as unknown as number;
        };
        this._pollInterval = setTimeout(loop, intervalMs) as unknown as number;
    }

    /**
     * Stop polling for cards.
     */
    stopPolling(): void {
        if (this._pollInterval !== null) {
            clearTimeout(this._pollInterval);
            this._pollInterval = null;
        }
    }

    private async _poll(): Promise<void> {
        // Step 1: REQA – wake up any card in the field (no CRC, 7-bit frame)
        this.regWrite(Reg.BitFraming, 0x07);
        try {
            const atqa = await this.transceive([PICC.REQA], false);
            if (atqa.length === 0) {
                this._lastUID = "";
                return;
            }
        } catch {
            this._lastUID = "";
            return;
        }

        // Step 2: Anti-collision – get UID bytes (no CRC)
        this.regWrite(Reg.BitFraming, 0x00);
        let acResp: Uint8Array;
        try {
            acResp = await this.transceive([PICC.SELECT1, 0x20], false);
        } catch {
            this._lastUID = "";
            return;
        }
        if (acResp.length < 5) {
            this._lastUID = "";
            return;
        }

        // acResp = [uid0, uid1, uid2, uid3, BCC]
        const uid = acResp.slice(0, 4);
        const bcc = acResp[4];

        // Step 3: SELECT – send full UID to move card into ACTIVE state (with CRC)
        try {
            const selResp = await this.transceive(
                [PICC.SELECT1, 0x70, uid[0], uid[1], uid[2], uid[3], bcc],
                true,
            );
            if (selResp.length === 0) {
                this._lastUID = "";
                return;
            }
        } catch {
            this._lastUID = "";
            return;
        }

        // Card is now ACTIVE – check if it's a new card
        const uidStr = this.uidToString(uid);
        if (uidStr === this._lastUID) {
            // Same card still present – do nothing
            return;
        }

        this._lastUID = uidStr;
        this.stopCrypto();

        if (this._onCard) {
            try {
                await this._onCard(uid);
            } catch (e) {
                console.log("RC522 onCard error: " + e);
            }
            this.stopCrypto();
            await this.haltCard();
            this._lastUID = "";
        }
    }
}
