import type { SPI } from "spi";

const BLOCK_SIZE = 16;
const MAX_MIFARE_CLASSIC_1K_BLOCK = 63;
const CASCADE_TAG = 0x88;
const CASCADE_BIT = 0x04;
const MIFARE_ACK = 0x0a;

enum Reg {
    Command = 0x01 << 1,
    ComIrq = 0x04 << 1,
    Error = 0x06 << 1,
    Status2 = 0x08 << 1,
    FifoData = 0x09 << 1,
    FifoLevel = 0x0a << 1,
    BitFraming = 0x0d << 1,
    Mode = 0x11 << 1,
    TxMode = 0x12 << 1,
    RxMode = 0x13 << 1,
    TxControl = 0x14 << 1,
    TxAsk = 0x15 << 1,
    TMode = 0x2a << 1,
    TPrescaler = 0x2b << 1,
    TReloadH = 0x2c << 1,
    TReloadL = 0x2d << 1,
}

enum ReaderCommand {
    Idle = 0x00,
    Transceive = 0x0c,
    Authenticate = 0x0e,
}

enum CardCommand {
    Request = 0x26,
    Select1 = 0x93,
    Select2 = 0x95,
    Select3 = 0x97,
    Halt = 0x50,
    AuthKeyA = 0x60,
    AuthKeyB = 0x61,
    Read = 0x30,
    Write = 0xa0,
}

const SELECT_COMMANDS = [
    CardCommand.Select1,
    CardCommand.Select2,
    CardCommand.Select3,
] as const;

/** UID of a selected ISO/IEC 14443-A card. */
export type CardUID = Uint8Array;

export type KeyType = "A" | "B";

/** Default MIFARE factory key (six 0xFF bytes). */
export const DEFAULT_KEY = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

export type TransceiveOptions = {
    command?: "transceive" | "authenticate";
    txCrc?: boolean;
    rxCrc?: boolean;
    txLastBits?: number;
};

/** A card did not respond before the RC522 timer expired. */
export class RC522TimeoutError extends Error {
    constructor(message: string = "RC522 communication timed out") {
        super(message);
        this.name = "RC522TimeoutError";
    }
}

/** Driver for an RC522 RFID reader connected over SPI. */
export class RC522 {
    readonly spi: SPI;
    readonly chipSelect: number;

    /**
     * Create and initialize an RC522 reader.
     * @param spi SPI bus used for communication.
     * @param chipSelect Chip-select pin of the RC522.
     */
    constructor(spi: SPI, chipSelect: number) {
        this.spi = spi;
        this.chipSelect = chipSelect;
        this.init();
    }

    /** Read one RC522 register. */
    private readReg(reg: Reg): number {
        return this.spi.transfer([reg | 0x80, 0], this.chipSelect, 2, false)[1];
    }

    /** Read several bytes from one RC522 register. */
    private readRegMany(reg: Reg, count: number): Uint8Array {
        if (count === 0) {
            return new Uint8Array();
        }

        const request = new Uint8Array(count + 1);
        request.fill(reg | 0x80);
        request[count] = 0;
        return this.spi.send(request, this.chipSelect).slice(1);
    }

    /** Write one or more bytes to an RC522 register. */
    private writeReg(reg: Reg, data: number | number[]): void {
        const bytes = typeof data === "number" ? [data] : data;
        this.spi.write([reg, ...bytes], this.chipSelect);
    }

    /** Set selected bits in an RC522 register. */
    private setRegBits(reg: Reg, mask: number): void {
        this.writeReg(reg, this.readReg(reg) | mask);
    }

    /** Clear selected bits in an RC522 register. */
    private clearRegBits(reg: Reg, mask: number): void {
        this.writeReg(reg, this.readReg(reg) & ~mask);
    }

    /** Configure the timer, modulation, CRC preset, and antenna. */
    private init(): void {
        this.writeReg(Reg.TMode, 0x80);
        this.writeReg(Reg.TPrescaler, 0xa9);
        this.writeReg(Reg.TReloadH, 0x03);
        this.writeReg(Reg.TReloadL, 0xe8);
        this.writeReg(Reg.TxAsk, 0x40);
        this.writeReg(Reg.Mode, 0x3d);
        this.setRegBits(Reg.TxControl, 0x03);
    }

    /**
     * Exchange data with a card or run MIFARE authentication.
     * @param data Bytes written to the RC522 FIFO.
     * @param options Command, CRC, and framing options.
     * @returns Bytes received from the card.
     * @throws {RC522TimeoutError} If the card does not respond in time.
     * @throws If the RC522 reports a communication or authentication error.
     */
    async transceive(
        data: number[],
        options: TransceiveOptions = {},
    ): Promise<Uint8Array> {
        const command = options.command === "authenticate" ? ReaderCommand.Authenticate: ReaderCommand.Transceive;
        const completionIrq = command === ReaderCommand.Authenticate ? 0x10 : 0x30;
        const txLastBits = options.txLastBits ?? 0;

        if (!Number.isInteger(txLastBits) || txLastBits < 0 || txLastBits > 7) {
            throw new Error("txLastBits must be an integer from 0 to 7");
        }

        if (options.txCrc) {
            this.setRegBits(Reg.TxMode, 0x80);
        } else {
            this.clearRegBits(Reg.TxMode, 0x80);
        }
        if (options.rxCrc) {
            this.setRegBits(Reg.RxMode, 0x80);
        } else {
            this.clearRegBits(Reg.RxMode, 0x80);
        }

        this.writeReg(Reg.Command, ReaderCommand.Idle);
        this.writeReg(Reg.ComIrq, 0x7f);
        this.writeReg(Reg.FifoLevel, 0x80);
        this.writeReg(Reg.BitFraming, txLastBits);
        this.writeReg(Reg.FifoData, data);
        try {
            this.writeReg(Reg.Command, command);

            if (command === ReaderCommand.Transceive) {
                this.setRegBits(Reg.BitFraming, 0x80);
            }

            let irq = 0;
            for (let attempt = 0; attempt < 50; attempt++) {
                irq = this.readReg(Reg.ComIrq);
                if (irq & (completionIrq | 0x01)) {
                    break;
                }
                await sleep(1);
            }

            if (irq & 0x01 || !(irq & completionIrq)) {
                throw new RC522TimeoutError();
            }

            const error = this.readReg(Reg.Error);
            if (error & 0xbf) {
                throw new Error(`RC522 communication error: 0x${error.toString(16).padStart(2, "0")}`);
            }

            if (command === ReaderCommand.Authenticate && !(this.readReg(Reg.Status2) & 0x08)) {
                throw new Error("MIFARE authentication failed");
            }

            const count = this.readReg(Reg.FifoLevel);
            return this.readRegMany(Reg.FifoData, count);
        } finally {
            this.writeReg(Reg.Command, ReaderCommand.Idle);
            this.clearRegBits(Reg.BitFraming, 0x80);
        }
    }

    /**
     * Find and select one ISO/IEC 14443-A card.
     * @returns The selected card UID, or `null` if no card responds.
     * @throws If card selection returns malformed data.
     */
    async readCard(): Promise<CardUID | null> {
        try {
            const answerToRequest = await this.transceive([CardCommand.Request], { txLastBits: 7 });
            if (answerToRequest.length < 2) {
                throw new Error("RC522 received an invalid ATQA response");
            }
        } catch (error) {
            if (error instanceof RC522TimeoutError) {
                return null;
            }
            throw error;
        }

        const uid: number[] = [];
        for (const selectCommand of SELECT_COMMANDS) {
            const anticollision = await this.transceive([selectCommand, 0x20]);
            if (anticollision.length < 5) {
                throw new Error("RC522 received a short anti-collision response");
            }

            const serial = anticollision.slice(0, 5);
            const bcc = serial[0] ^ serial[1] ^ serial[2] ^ serial[3];
            if (bcc !== serial[4]) {
                throw new Error("RC522 received an invalid UID checksum");
            }

            const selection = await this.transceive(
                [selectCommand, 0x70, ...serial],
                { txCrc: true, rxCrc: true },
            );
            if (selection.length < 1) {
                throw new Error("RC522 received a short SELECT response");
            }

            const moreLevels = (selection[0] & CASCADE_BIT) !== 0;
            const hasCascadeTag = serial[0] === CASCADE_TAG;
            if (moreLevels !== hasCascadeTag) {
                throw new Error("RC522 received an inconsistent UID cascade");
            }

            uid.push(...serial.slice(hasCascadeTag ? 1 : 0, 4));
            if (!moreLevels) {
                if (uid.length !== 4 && uid.length !== 7 && uid.length !== 10) {
                    throw new Error("RC522 received an unsupported UID length");
                }
                return new Uint8Array(uid);
            }
        }

        throw new Error("RC522 UID uses too many cascade levels");
    }

    /**
     * Put the selected card into the HALT state.
     * @throws If the RC522 reports an error other than the expected timeout.
     */
    async halt(): Promise<void> {
        try {
            await this.transceive([CardCommand.Halt, 0x00], { txCrc: true });
        } catch (error) {
            if (!(error instanceof RC522TimeoutError)) {
                throw error;
            }
        }
    }

    /** Clear the Crypto1 state after a MIFARE Classic session. */
    clearCrypto(): void {
        this.clearRegBits(Reg.Status2, 0x08);
    }
}

function validateBlock(block: number): void {
    if (!Number.isInteger(block) || block < 0 || block > MAX_MIFARE_CLASSIC_1K_BLOCK) {
        throw new Error("block must be an integer from 0 to 63");
    }
}

function validateUID(uid: CardUID): void {
    if (uid.length !== 4 && uid.length !== 7 && uid.length !== 10) {
        throw new Error("UID must contain 4, 7, or 10 bytes");
    }
}

function requireAck(response: Uint8Array): void {
    if (response.length !== 1 || (response[0] & 0x0f) !== MIFARE_ACK) {
        throw new Error("MIFARE Classic card rejected the write");
    }
}

/** Authenticated block access for MIFARE Classic 1K cards. */
export class MifareClassic {
    readonly reader: RC522;

    /**
     * Create a MIFARE Classic helper for an RC522 reader.
     * @param reader Reader used for card communication.
     */
    constructor(reader: RC522) {
        this.reader = reader;
    }

    /**
     * Authenticate the sector containing a block.
     * @param uid UID returned by `RC522.readCard()`.
     * @param block Block number from 0 to 63.
     * @param key Six-byte MIFARE key.
     * @param keyType Selects key A or key B.
     * @throws If an argument is invalid or authentication fails.
     */
    async authenticate(uid: CardUID, block: number, key: number[] = DEFAULT_KEY, keyType: KeyType = "A"): Promise<void> {
        validateBlock(block);
        validateUID(uid);
        if (key.length !== 6) {
            throw new Error("key must contain exactly 6 bytes");
        }
        if (keyType !== "A" && keyType !== "B") {
            throw new Error('keyType must be "A" or "B"');
        }

        const command = keyType === "A" ? CardCommand.AuthKeyA : CardCommand.AuthKeyB;
        await this.reader.transceive(
            [command, block, ...key, ...uid.slice(-4)],
            { command: "authenticate" },
        );
    }

    /**
     * Read an authenticated 16-byte block.
     * @param block Block number from 0 to 63.
     * @returns The 16 data bytes stored in the block.
     * @throws If the block number or card response is invalid.
     */
    async readBlock(block: number): Promise<Uint8Array> {
        validateBlock(block);
        const response = await this.reader.transceive([CardCommand.Read, block], { txCrc: true, rxCrc: true });
        if (response.length < BLOCK_SIZE) {
            throw new Error(
                `MIFARE Classic returned ${response.length} bytes for a block read`,
            );
        }
        return response.slice(0, BLOCK_SIZE);
    }

    /**
     * Write an authenticated 16-byte data block.
     * @param block Writable block number from 1 to 63.
     * @param data Exactly 16 bytes to write.
     * @throws If the input is invalid, the block is protected, or the card rejects the write.
     */
    async writeBlock(block: number, data: number[]): Promise<void> {
        validateBlock(block);
        if (block === 0) {
            throw new Error("writing the manufacturer block is not allowed");
        }
        if (block % 4 === 3) {
            throw new Error("writing sector trailers is not allowed");
        }

        if (data.length !== BLOCK_SIZE) {
            throw new Error("data must contain exactly 16 bytes");
        }

        requireAck(await this.reader.transceive([CardCommand.Write, block], { txCrc: true }));
        requireAck(await this.reader.transceive(data, { txCrc: true }));
    }

    /** End the current authenticated card session. */
    stopCrypto(): void {
        this.reader.clearCrypto();
    }
}


/**
 * Format a UID as uppercase hexadecimal bytes separated by colons.
 * @param uid UID bytes to format.
 * @returns A string such as `01:AB:23:CD`.
 */
export function formatUID(uid: CardUID): string {
    return Array.from(uid, (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(":");
}
