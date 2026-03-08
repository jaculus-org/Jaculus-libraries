import { I2C } from "i2c";
export declare class HD44780 {
    private readonly i2c;
    private readonly addr;
    constructor(i2c: I2C, addr?: number);
    private init;
    private write;
    clear(): void;
    print(str: string): void;
    cursor(block: boolean): void;
    setCursor(x: number, y: number): void;
    createChar(characterIndex: number, charData: number[]): void;
}
