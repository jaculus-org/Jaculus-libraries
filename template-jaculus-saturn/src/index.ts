import { GameLoop } from "game-loop";
import { createSaturn } from "saturn";
import { LineSegment } from "shapes";
import * as colors from "colors";


let sat = createSaturn();
let loop = new GameLoop(sat.display);

let line = new LineSegment({
    x: 32,
    y: 32,
    x2: 48,
    y2: 48,
    color: colors.red,
});
loop.addShape(line);

loop.on("tick", (delta) => {
    line.rotate(5);
});
