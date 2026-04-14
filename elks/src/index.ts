export const Pins = {
    SW0: 18,
    SW1: 16,
    SW2: 42,
    LED_G: 17, // incorrect on silkscreen (IO3 -> IO17)
    LED_Y: 15,
    LED_R: 45,
    LED_B: 46,
    POT0: 2,
    POT1: 1, // analog pin
    BUZZER_PIN_A: 0,
    BUZZER_PIN_B: 3,
    SER0: 35,
    SER1: 40,
    ILED_ESP32: 48,
    ILED_EXTERNAL: 21,
    SCL: 47,
    SDA: 48,
} as const;

export const pmod0 = {
    side1: {
        Pin1: 41,
        Pin2: 37,
        Pin3: 39,
        Pin4: 5,
    } as const,
    side2: {
        Pin1: 36,
        Pin2: 38,
        Pin3: 4,
        Pin4: 6,
    } as const,
} as const;

export const pmod1 = {
    side1: {
        Pin1: 7, // analog pin
        Pin2: 12,
        Pin3: 13,
        Pin4: 14,
    } as const,
    side2: {
        Pin1: 10, // analog pin
        Pin2: 9, // analog pin
        Pin3: 8, // analog pin
        Pin4: 11,
    } as const,
} as const;
