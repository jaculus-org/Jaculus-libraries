import * as gpio from "gpio";

type ButtonEventCallbacks = {
    press?: () => void;
    release?: () => void;
    click?: (duration?: number) => void;
    doubleClick?: () => void;
};

type ButtonEvent = keyof ButtonEventCallbacks;

/**
 * Event-driven button handler.
 * Only a single callback can be registered for each event.
 */
export class Button {
    /** Maximum time (ms) between two clicks to be considered a double click. */
    private doubleClickLimit: number;

    /** Timestamp of the last button press. */
    private lastFallingTime: number;

    /** Timeout used to delay click detection while waiting for a possible second click. */
    private clickTimeout: number;

    /** GPIO pin connected to the button. */
    private buttonPin: number;

    /** Registered event callbacks. */
    private eventCallbacks: ButtonEventCallbacks;

    /**
     * Creates a new button instance.
     *
     * @param buttonPin GPIO pin connected to the button.
     * @param doubleClickLimit Maximum interval in milliseconds between two clicks
     * to recognize them as a double click. Defaults to 250 ms.
     */
    constructor(buttonPin: number, doubleClickLimit: number = 250) {
        gpio.pinMode(buttonPin, gpio.PinMode.INPUT);

        this.doubleClickLimit = doubleClickLimit;
        this.lastFallingTime = 0;
        this.clickTimeout = 0;
        this.buttonPin = buttonPin;
        this.eventCallbacks = {};

        gpio.on("falling", buttonPin, this.handleFallingEvent.bind(this));
        gpio.on("rising", buttonPin, this.handleRisingEvent.bind(this));
    }

    /**
     * Unregisters GPIO event handlers associated with this button.
     */
    close() {
        gpio.off("falling", this.buttonPin);
        gpio.off("rising", this.buttonPin);
    }

    /**
   * Registers a callback for a button event.

   * Only one callback may be registered per event.
   *
   * @param event Event to listen for.
   * @param callback Function invoked when the event occurs. For the `click` event, the callback receives the duration of the button press in milliseconds.
   *
   * @throws Error if a callback for the event is already registered.
   */
    on<E extends ButtonEvent>(
        event: E,
        callback: ButtonEventCallbacks[E],
    ): void {
        if (this.eventCallbacks[event]) {
            throw new Error(
                `Event ${event} already has a callback registered.`,
            );
        }

        this.eventCallbacks[event] = callback;
    }

    /**
     * Removes the callback associated with a button event.
     *
     * @param event Event whose callback should be removed.
     *
     * @throws Error if no callback is registered for the event.
     */
    off(event: ButtonEvent) {
        if (!this.eventCallbacks[event]) {
            throw new Error(
                `Event ${event} does not have a callback registered.`,
            );
        }

        delete this.eventCallbacks[event];
    }

    /**
     * Handles the GPIO falling-edge event.
     *
     * Triggers the `press` callback and records the press timestamp.
     *
     * @param info GPIO event information.
     */
    private handleFallingEvent(info: gpio.EventInfo) {
        this.eventCallbacks["press"]?.();

        this.lastFallingTime = info.timestamp.millis();
    }

    /**
     * Handles the GPIO rising-edge event.
     *
     * Triggers the `release` callback. If another click occurs within the
     * configured double-click interval, a `doubleClick` event is emitted.
     * Otherwise, a delayed `click` event is emitted.
     *
     * @param info GPIO event information.
     */
    private handleRisingEvent(info: gpio.EventInfo) {
        this.eventCallbacks["release"]?.();

        if (this.lastFallingTime === 0) {
            return;
        }

        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.eventCallbacks["doubleClick"]?.();
            this.clickTimeout = 0;
        } else {
            this.clickTimeout = setTimeout(() => {
                this.eventCallbacks["click"]?.(
                    info.timestamp.millis() - this.lastFallingTime,
                );
                this.clickTimeout = 0;
            }, this.doubleClickLimit);
        }
    }
}
