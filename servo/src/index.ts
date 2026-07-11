import { PWM } from "pwm";

/**
 * A class for controlling a servo motor.
 */
export class Servo {
    private pwm: PWM;

    /**
     * Create a new servo object.
     * @param pin The pin the servo is connected to.
     */
    constructor(pin: number) {
        this.pwm = new PWM({ pin, frequency: 50, resolution: 12 });
    }

    /**
     * Set the servo position.
     * @param value The position to set the servo to, from 0-1023.
     */
    write(value: number) {
        // map the value from 0-1023 to 0.5-2.5ms
        const ms = (value / 1023) * 2 + 0.5; // 0.5-2.5ms is the range of a servo

        // convert to a duty cycle (12 bit resolution, max 4095)
        const duty = (ms / 20) * 4095; // 20ms is the period of a servo

        this.pwm.setDuty(duty); // set the duty cycle to the servo
    }

    /**
     * Release the PWM resources used by the servo.
     */
    close() {
        this.pwm.close();
    }
}
