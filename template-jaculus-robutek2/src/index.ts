import { createRobutek } from "robutek";

const robutek = createRobutek("V2");
robutek.setSpeed(100);
robutek.setRamp(2000);

setInterval(() => {
    const fl = robutek.readSensor("LineFL");
    const fr = robutek.readSensor("LineFR");
    console.log(`Sensors FL: ${fl.toFixed(2)}, FR: ${fr.toFixed(2)}`);
}, 1000);

for (let i = 0; i < 4; i++) {
    await robutek.move(0, { distance: 100 });
    await robutek.rotate(90);
}
