import * as gpio from "gpio";

export function add(a: number, b: number): number {
    return a + b;
}

export function gpioSetOutput(pin: number): void {
    gpio.pinMode(pin, gpio.PinMode.OUTPUT);
}
