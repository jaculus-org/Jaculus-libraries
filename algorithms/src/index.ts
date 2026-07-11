/**
 * High-performance Exponential Moving Average (EMA) filter with rounding.
 * Uses fixed-point arithmetic for fast integer operations.
 * Note: JavaScript bitwise operations work only with 32-bit signed integers.
 * Maximum safe storage value is 2,147,483,647.
 * @param shift Smoothing coefficient (window ≈ 2^shift samples)
 * @returns Filter function that takes a sample and returns the smoothed value
 */
export const createEmaFilter = (shift: number) => {
    let storage: number | null = null;
    const offset = 1 << (shift - 1); // Half the divisor for rounding

    return (newValue: number): number => {
        if (storage === null) {
            storage = newValue << shift;
            return newValue;
        }

        storage = storage - (storage >> shift) + newValue;
        return (storage + offset) >> shift;
    };
};

export type PidControllerConfig = {
    kp: number;
    ki: number;
    kd: number;
    outputMin?: number;
    outputMax?: number;
    integralMin?: number;
    integralMax?: number;
};

export type PidControllerInput = {
    setpoint: number;
    measurement: number;
    dt: number;
};

export type PidController = {
    update: (input: PidControllerInput) => number;
    reset: () => void;
};

const clamp = (value: number, min: number, max: number) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
};

/**
 * PID controller for closed-loop control.
 * @param config PID gains and optional output/integral limits
 * @returns Controller with update() and reset()
 */
export const createPidController = (
    config: PidControllerConfig,
): PidController => {
    const {
        kp,
        ki,
        kd,
        outputMin = Number.NEGATIVE_INFINITY,
        outputMax = Number.POSITIVE_INFINITY,
        integralMin = Number.NEGATIVE_INFINITY,
        integralMax = Number.POSITIVE_INFINITY,
    } = config;

    let integral = 0;
    let previousError: number | null = null;

    return {
        update: ({ setpoint, measurement, dt }: PidControllerInput): number => {
            if (!Number.isFinite(dt) || dt <= 0) {
                throw new Error("PID dt must be a positive finite number");
            }

            const error = setpoint - measurement;
            integral = clamp(integral + error * dt, integralMin, integralMax);

            const derivative =
                previousError === null ? 0 : (error - previousError) / dt;
            previousError = error;

            const output = kp * error + ki * integral + kd * derivative;
            return clamp(output, outputMin, outputMax);
        },
        reset: () => {
            integral = 0;
            previousError = null;
        },
    };
};
