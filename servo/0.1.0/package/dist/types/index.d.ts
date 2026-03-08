/**
 * A class for controlling a servo motor.
 */
export declare class Servo {
    private channel;
    /**
     * Create a new servo object.
     * @param pin The pin the servo is connected to.
     * @param timer The timer to use for PWM.
     * @param channel The channel to use for PWM.
     */
    constructor(pin: number, timer: number, channel: number);
    /**
     * Set the servo position.
     * @param value The position to set the servo to, from 0-1023.
     */
    write(value: number): void;
}
