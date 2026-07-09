import * as gpio from "gpio";

/**
 * Supported button event callbacks.
 */
type ButtonEventCallbacks = {
    press?: (timestamp: gpio.EventInfo) => void;
    release?: (timestamp: gpio.EventInfo) => void;
    click?: (duration?: number) => void;
    doubleClick?: () => void;
};

/**
 * Names of the events emitted by Button.
 */
type ButtonEvent = keyof ButtonEventCallbacks;

/**
 * Debounced GPIO button helper with press, release, click, and double-click events.
 */
export class Button {
    /** GPIO pin number used by the button. */
    private readonly buttonPin: number;

    /** Whether the button is active-low. */
    private readonly isInverted: boolean;

    /** Debounce interval in milliseconds. */
    private readonly debounceTime: number;

    /** Time between clicks to be considered double click */
    private readonly doubleClickLimit: number;

    /** Registered event callbacks. */
    private eventCallbacks: ButtonEventCallbacks = {};

    /** Last stable button state (true = pressed). */
    private stablePressed: boolean;

    /** Timestamp of the last confirmed press. */
    private lastPressTime = 0;

    /** Most recent interrupt info. */
    private lastEvent!: gpio.EventInfo;

    /** Debounce timer. */
    private debounceTimeout = 0;

    /** Waiting for second click. */
    private clickTimeout = 0;

    /**
     * Creates a button handler for a GPIO input pin.
     *
     * @param buttonPin GPIO pin number used by the button.
     * @param doubleClickLimit Maximum time in milliseconds between clicks.
     * @param debounceTime Debounce interval in milliseconds.
     * @param inverted Set to true when the button is active-low.
     */
    constructor(
        buttonPin: number,
        doubleClickLimit = 250,
        debounceTime = 30,
        inverted = false,
    ) {
        this.buttonPin = buttonPin;
        this.doubleClickLimit = doubleClickLimit;
        this.debounceTime = debounceTime;
        this.isInverted = inverted;

        gpio.pinMode(buttonPin, gpio.PinMode.INPUT);

        // Initial stable state.
        this.stablePressed = this.isPressed();

        const handler = this.handleInterrupt.bind(this);

        gpio.on("falling", buttonPin, handler);
        gpio.on("rising", buttonPin, handler);
    }

    /**
     * Removes GPIO listeners and clears any pending timers.
     */
    close() {
        gpio.off("falling", this.buttonPin);
        gpio.off("rising", this.buttonPin);

        clearTimeout(this.debounceTimeout);
        clearTimeout(this.clickTimeout);
    }

    /**
     * Registers a callback for a button event.
     *
     * @template E Button event name.
     * @param event Event name to subscribe to.
     * @param callback Callback invoked when the event occurs.
     */
    on<E extends ButtonEvent>(
        event: E,
        callback: ButtonEventCallbacks[E],
    ): void {
        if (this.eventCallbacks[event]) {
            throw new Error(`Event ${event} already has a callback.`);
        }

        this.eventCallbacks[event] = callback;
    }

    /**
     * Removes a previously registered callback.
     *
     * @param event Event name to unsubscribe from.
     */
    off(event: ButtonEvent): void {
        if (!this.eventCallbacks[event]) {
            throw new Error(`Event ${event} has no callback.`);
        }

        delete this.eventCallbacks[event];
    }

    /**
     * Returns whether the button is currently pressed.
     *
     * @returns True when the input is in the pressed state.
     */
    isPressed(): boolean {
        return gpio.read(this.buttonPin) === (this.isInverted ? 1 : 0);
    }

    /**
     * Handles every GPIO edge and schedules debounce processing.
     *
     * @param info Interrupt metadata from the GPIO edge.
     */
    private handleInterrupt(info: gpio.EventInfo) {
        this.lastEvent = info;

        clearTimeout(this.debounceTimeout);

        this.debounceTimeout = setTimeout(() => {
            this.debounceTimeout = 0;

            const pressed = this.isPressed();

            // No stable change.
            if (pressed === this.stablePressed) {
                return;
            }

            this.stablePressed = pressed;

            if (pressed) {
                this.handlePress(this.lastEvent);
            } else {
                this.handleRelease(this.lastEvent);
            }
        }, this.debounceTime);
    }

    /**
     * Handles a confirmed button press.
     *
     * @param info Interrupt metadata for the press event.
     */
    private handlePress(info: gpio.EventInfo) {
        this.lastPressTime = info.timestamp.millis();
        this.eventCallbacks.press?.(info);
    }

    /**
     * Handles a confirmed button release and click detection.
     *
     * @param info Interrupt metadata for the release event.
     */
    private handleRelease(info: gpio.EventInfo) {
        this.eventCallbacks.release?.(info);

        const duration = info.timestamp.millis() - this.lastPressTime;

        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = 0;
            this.eventCallbacks.doubleClick?.();
            return;
        }

        this.clickTimeout = setTimeout(() => {
            this.clickTimeout = 0;
            this.eventCallbacks.click?.(duration);
        }, this.doubleClickLimit);
    }
}
