import * as motor from "motor";
export declare class DifferentialDrive {
    private speed;
    private ramp;
    private diameter;
    leftMotor: motor.Motor;
    rightMotor: motor.Motor;
    constructor(leftMotor: motor.Motor, rightMotor: motor.Motor, diameter: number);
    setSpeed(value: number): void;
    setRamp(value: number): void;
    getSpeed(): number;
    getRamp(): number;
    /**
     * Move the robot
     * @param curve number in range -1 to 1, where -1 is full left, 0 is straight and 1 is full right
     * @param duration optional duration of the move
     */
    move(curve: number, duration?: motor.MoveDuration): Promise<void>;
    /**
     * Rotate the robot
     * @param angle in degrees
     */
    rotate(angle: number): Promise<void>;
    private headingOffset;
    private getHeadingRaw;
    /**
     * Get the current heading of the robot, measured from start
     * @returns heading in degrees
     */
    getHeading(): number;
    /**
     * Get the current heading of the robot, clamped to 0-360 degrees
     * @returns heading in degrees, always in range 0-360
     */
    getHeadingClamped(): number;
    /**
     * Reset the heading of the robot to 0 degrees
     */
    resetHeading(): void;
    /**
     * Stop the robot
     * @param brake if true, the robot will brake, otherwise it will coast to a stop
     */
    stop(brake?: boolean): Promise<void>;
}
