import { Display } from "rphub75";
import { rgb } from "colors";
import * as colors from "colors";

const display = new Display();
display.fill(colors.orange);
display.show();

await sleep(1000);

for (let i = 0; i < display.width; i++) {
    for (let j = 0; j < display.height; j++) {
        if ((i + j) % 2 === 0) {
            display.setPixel(i, j, rgb(0, 40, 70));
        }
    }
}

display.show();
