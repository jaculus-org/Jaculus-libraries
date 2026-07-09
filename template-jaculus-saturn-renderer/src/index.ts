import { Display } from "rphub75";
import { rgb } from "colors";
import * as colors from "colors";
import { Renderer, Format, Font, Texture } from "renderer";
import { Circle, Rectangle, Point, LineSegment, Collection } from "shapes";

const display = new Display();

const renderer = new Renderer(display.width, display.height);

const collection = new Collection({ x: 0, y: 0, color: colors.white, z: 0 });

const circle = new Circle({
    x: 32,
    y: 32,
    radius: 8,
    color: rgb(255, 255, 0),
    fill: true,
});

const squareFilled = new Rectangle({
    x: 10,
    y: 10,
    width: 20,
    height: 20,
    color: rgb(0, 255, 0),
    fill: true,
});

const squareEmpty = new Rectangle({
    x: 40,
    y: 40,
    width: 20,
    height: 20,
    color: rgb(255, 0, 0),
    fill: false,
});

collection.add(circle);
collection.add(squareFilled);
collection.add(squareEmpty);

circle.setPosition(50, 32);

// FIX ME
// const font = new Font();
// renderer.drawText(display.frame, "Hello World!", 32,32, font, colors.pink, false, Format.RGB_888);

// just render the collection once
renderer.render(collection, display.frame, true, Format.RGB_888);
display.show();

// render the collection continuously - rotate it
// collection.setPivot(32, 32);
// setInterval(() => {
//     collection.rotate(1);
//     renderer.render(collection, display.frame, true, Format.RGB_888);
//     display.show();
// }, 1000 / 60);
