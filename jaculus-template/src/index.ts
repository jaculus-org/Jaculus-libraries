import * as gpio from "gpio";

/**
 * This example blinks an LED on pin 46.
 */

const LED_PIN = 46;

gpio.pinMode(LED_PIN, gpio.PinMode.OUTPUT);

let state = false;

setInterval(() => {
  gpio.write(LED_PIN, state ? 1 : 0);
  state = !state;
}, 1000);
