import * as motor from "motor";
import { DifferentialDrive } from "differential-drive";
declare enum PinsV1 {
    StatusLED = 46,
    ILED = 48,
    ButtonLeft = 2,
    ButtonRight = 0,
    Servo1 = 21,
    Servo2 = 38,
    Sens1 = 5,
    Sens2 = 4,
    Sens3 = 6,
    Sens4 = 7,
    SensSW = 8,
    SensEN = 47,
    Motor1A = 11,
    Motor1B = 12,
    Motor2A = 45,
    Motor2B = 13,
    Enc1A = 39,
    Enc1B = 40,
    Enc2A = 42,
    Enc2B = 41
}
declare enum PinsV2 {
    StatusLED = 46,
    ILED = 48,
    ILEDConnector = 36,
    ButtonLeft = 2,
    ButtonRight = 0,
    Servo1 = 21,
    Servo2 = 38,
    Sens1 = 4,
    Sens2 = 5,
    Sens3 = 6,
    Sens4 = 7,
    SensSW = 8,
    SensEN = 47,
    Motor1A = 11,
    Motor1B = 12,
    Motor2A = 45,
    Motor2B = 13,
    Enc1A = 40,
    Enc1B = 39,
    Enc2A = 41,
    Enc2B = 42,
    SDA = 10,
    SCL = 3
}
type RobutekLedcConfig = {
    timer: number;
    channels: [number, number, number, number];
};
export type SensorType = "WheelFL" | "WheelFR" | "WheelBL" | "WheelBR" | "LineFL" | "LineFR" | "LineBL" | "LineBR";
export declare class Robutek<PinsType extends typeof PinsV1 | typeof PinsV2> extends DifferentialDrive {
    private ledcConfig;
    readonly Pins: PinsType;
    readonly PenPos: {
        Down: number;
        Up: number;
        Unload: number;
    };
    constructor(pins: PinsType, encTicks: number, reg: motor.RegParams, ledcConfig: RobutekLedcConfig);
    private sw;
    switchSensors(toValue: number): void;
    readSensor(sensor: SensorType): number;
    setStatusLED(state: number): void;
    close(): void;
}
export declare const defaultLedcConfig: RobutekLedcConfig;
export declare function createRobutek(version: "V1", ledcConfig?: RobutekLedcConfig): Robutek<typeof PinsV1>;
export declare function createRobutek(version: "V2", ledcConfig?: RobutekLedcConfig): Robutek<typeof PinsV2>;
export {};
