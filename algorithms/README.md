# Algorithms

Collection of optimized algorithms for signal processing and data analysis.

## Exponential Moving Average (EMA)

### Overview

**Exponential Moving Average** is a filter that smooths data by giving more weight to recent values while gradually discounting older observations. It's essential for:

- Sensor data smoothing
- Trend detection
- Noise reduction in real-time systems

### Fast EMA Implementation

The `createEmaFilter` function provides a high-performance EMA filter optimized for microcontrollers and performance-critical JavaScript:

**Why "Fast"?**

- **Memory**: O(1) - stores only a single state variable
- **Speed**: Only 1 subtraction, 1 addition, 2 bit shifts per call
- **No float**: Uses fixed-point integer arithmetic
- **Stable**: Jumps to real value on initialization, not starting from zero

### Usage

```typescript
import { createEmaFilter } from "algorithms";

// Create filter with shift=2 (window ≈ 4 samples, fastest response)
const ema = createEmaFilter(2);

// Process sensor readings
console.log(ema(100)); // 100 (first value, initialized)
console.log(ema(102)); // 101 (smoothed toward 102)
console.log(ema(50)); // 80  (smoothed toward 50)
console.log(ema(48)); // 65
console.log(ema(150)); // 111 (smoothed toward 150)

// Shift=4 (window ≈ 16 samples, smoother, slower response)
const smoothEma = createEmaFilter(4);
console.log(smoothEma(100)); // 100
console.log(smoothEma(102)); // 101
console.log(smoothEma(50)); // 93  (smoother transition)
console.log(smoothEma(48)); // 86
console.log(smoothEma(150)); // 104 (slower response)
```

### Parameters

- **shift** (number): Controls smoothing strength
    - Relationship: window ≈ 2^shift samples
    - **shift=2**: Fast response, window ≈ 4 samples
    - **shift=4**: Balanced, window ≈ 16 samples
    - **shift=6**: Smoother, window ≈ 64 samples
    - **shift=8**: Very smooth, window ≈ 256 samples

### How It Works

#### Storage Variable

**storage** is the internal state variable that accumulates the smoothed value. It holds the weighted average multiplied by 2^shift to keep everything as integers. For example:

- With shift=2: `storage = 100` means the actual smoothed value is 25 (100 ÷ 4)
- With shift=4: `storage = 400` means the actual smoothed value is 25 (400 ÷ 16)

#### Fixed-Point Arithmetic

To avoid floating-point operations:

- Store value multiplied by 2^shift internally (into `storage`)
- All operations use integer bit shifts and arithmetic
- Extract and display using right shift (>>) operation

#### Algorithm

```
storage = storage - (storage >> shift) + newValue
output = (storage + offset) >> shift  // offset = 2^(shift-1) for rounding
```

#### Rounding

Without rounding, results round down. Adding `offset` before the division gives proper banker's rounding (0.5+ rounds up):

```
// Example: shift=2 (divisor=4)
stored value: 10 (represents 2.5 in fixed-point)
Without rounding: 10 >> 2 = 2
With rounding:    (10 + 2) >> 2 = 3 ✓
```

### Limitations

- JavaScript bitwise operations work with 32-bit signed integers
- Maximum safe storage value: 2,147,483,647
- For 16-bit sensor data (0-65535), safe shift range is 0-14

## PID Controller

### Overview

**PID (Proportional-Integral-Derivative) Controller** is a closed-loop control algorithm used to drive a measured value (speed, angle, distance, temperature) toward a target setpoint.

- **P** reacts to current error
- **I** compensates long-term steady-state error
- **D** dampens fast changes and overshoot

### Usage

```typescript
import { createPidController } from "algorithms";

const pid = createPidController({
    kp: 1.2,
    ki: 0.4,
    kd: 0.05,
    outputMin: -255,
    outputMax: 255,
    integralMin: -200,
    integralMax: 200,
});

const control = pid.update({
    setpoint: 300,
    measurement: 250,
    dt: 0.02, // 20 ms control loop
});

console.log(control); // PWM or motor command
```

### API

`createPidController(config)` returns an object with:

- `update({ setpoint, measurement, dt })` -> computed control output
- `reset()` -> clears integral and derivative history

### Parameters

`config` fields:

- `kp` (number): proportional gain
- `ki` (number): integral gain
- `kd` (number): derivative gain
- `outputMin` (number, optional): lower output clamp
- `outputMax` (number, optional): upper output clamp
- `integralMin` (number, optional): lower integral clamp (anti-windup)
- `integralMax` (number, optional): upper integral clamp (anti-windup)

`update` input fields:

- `setpoint` (number): desired target value
- `measurement` (number): current measured value
- `dt` (number): loop period in seconds; must be positive and finite

### Notes

- Start tuning with `ki = 0` and `kd = 0`, then increase `kp`
- Add small `ki` to remove steady-state error
- Add `kd` only if needed to reduce overshoot/noise sensitivity
- Always use output/integral limits for motor control loops

### Larger Example (ADC -> LEDC with PID)

The following example builds on your ADC-to-LEDC pattern and adds PID so LED brightness changes smoothly and controllably.

```typescript
import * as adc from "adc";
import * as ledc from "ledc";
import { createPidController } from "algorithms";

const INPUT_PIN = 1;
const LED_PIN = 46;

const PWM_TIMER = 0;
const PWM_CHANNEL = 0;
const PWM_MIN = 0;
const PWM_MAX = 1023;

adc.configure(INPUT_PIN);
ledc.configureTimer(PWM_TIMER, 1000);
ledc.configureChannel(PWM_CHANNEL, LED_PIN, PWM_TIMER, PWM_MAX);

const power = 3;
const dt = 0.01; // 10 ms

const pid = createPidController({
    kp: 0.1,
    ki: 0.05,
    kd: 0.005,
    outputMin: -120,
    outputMax: 120,
    integralMin: -400,
    integralMax: 400,
});

let currentDuty = 0;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

setInterval(() => {
    // Target value from ADC (same non-linear response as your example).
    const adcValue = adc.read(INPUT_PIN);
    const targetDuty = Math.pow(adcValue, power) / Math.pow(1023, power - 1);

    // PID output is used as duty increment/decrement per cycle.
    const step = pid.update({
        setpoint: targetDuty,
        measurement: currentDuty,
        dt,
    });

    currentDuty = clamp(currentDuty + step, PWM_MIN, PWM_MAX);
    ledc.setDuty(PWM_CHANNEL, currentDuty);
}, 50);
```

Why this helps:

- Direct mapping (`setDuty(mappedValue)`) can jump abruptly.
- PID treats brightness as a controlled process and moves toward target smoothly.
- Output and integral limits prevent aggressive jumps and windup.

### Using PID with Motor Speed

For motors, the wiring is similar, only your `measurement` should come from encoder speed (or another real feedback source):

```typescript
import { createPidController } from "algorithms";

const pid = createPidController({
    kp: 1.2,
    ki: 0.35,
    kd: 0.02,
    outputMin: -1023,
    outputMax: 1023,
    integralMin: -3000,
    integralMax: 3000,
});

const dt = 0.01; // 10 ms control loop

setInterval(() => {
    const targetSpeed = 220; // mm/s, from joystick/plan
    const measuredSpeed = getMotorSpeedMmS(); // from encoder

    const motorCommand = pid.update({
        setpoint: targetSpeed,
        measurement: measuredSpeed,
        dt,
    });

    setMotorPower(motorCommand); // e.g. setRaw / PWM duty
}, 10);
```

Motor checklist:

- `setpoint`: desired speed (or position/angle)
- `measurement`: encoder-derived actual value
- `output`: motor command (PWM/raw power/current request)
- Keep loop period fixed and pass it as `dt` in seconds
