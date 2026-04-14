# Jaculus Utilities Library

Collection of practical helper functions for value normalization, range mapping, and bounds limiting.

## Overview

This package currently provides three numeric helpers:

- `scale` for normalized values in range `[0, 1]`
- `map` for mapping from one range to another
- `clamp` for hard-limiting to min/max bounds

## scale

### What It Does

`scale(value, min, max)` converts a value from range `[min, max]` to normalized `[0, 1]`, then limits the result to `[0, 1]`.

### Formula

```
scaled = (value - min) / (max - min)
result = clamp(scaled, 0, 1)
```

### Edge Case

If `min === max`, the function returns `0` to avoid division by zero.

### Example

```typescript
import * as utils from "utils";

console.log(utils.scale(512, 0, 1023)); // ~0.5
console.log(utils.scale(1400, 0, 1023)); // 1
console.log(utils.scale(-10, 0, 1023)); // 0
```

## map

### What It Does

`map(value, inMin, inMax, outMin, outMax)` linearly converts a value from one range to another.

### Formula

```
result = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
```

### Edge Case

If `inMin === inMax`, the function returns `outMin`.

### Example

```typescript
import * as utils from "utils";

// Map ADC value (0..1023) to PWM duty (0..255)
const duty = utils.map(512, 0, 1023, 0, 255);
console.log(duty); // ~127.6
```

## clamp

### What It Does

`clamp(value, min, max)` limits a value so that it always stays inside `[min, max]`.

### Example

```typescript
import * as utils from "utils";

console.log(utils.clamp(1200, 0, 1023)); // 1023
console.log(utils.clamp(-5, 0, 1023)); // 0
console.log(utils.clamp(500, 0, 1023)); // 500
```

## Quick Comparison

- Use `scale` when you need normalized output in `[0, 1]`.
- Use `map` when you need to convert between arbitrary ranges.
- Use `clamp` when you need to enforce hard safety limits.

## Typical Robotics Usage

```typescript
import * as adc from "adc";
import * as ledc from "ledc";
import * as utils from "utils";

adc.configure(1);
ledc.configureTimer(0, 1000);
ledc.configureChannel(0, 46, 0, 1023);

setInterval(() => {
    const raw = adc.read(1);
    const duty = utils.map(raw, 0, 1023, 0, 1023);
    ledc.setDuty(0, utils.clamp(duty, 0, 1023));
}, 20);
```
