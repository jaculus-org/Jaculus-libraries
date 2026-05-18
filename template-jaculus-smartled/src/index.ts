import { LED_WS2812B, SmartLed } from "smartled"
import * as colors from "colors";

const ledStrip = new SmartLed(48, 1, LED_WS2812B);  // led strip on pin 48 with 1 LED

ledStrip.clear();                                   // clear the strip (turn off all LEDs)
ledStrip.set(0, colors.red);                        // set the first LED (index 0) to red color
ledStrip.show();                                    // update the strip to show the changes
