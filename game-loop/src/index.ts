import * as shapes from "shapes";
import { Renderer, Format, Font } from "renderer";


type DisplayLike = {
    width: number;
    height: number;
    frame: ArrayBuffer;
    rotation: number;
    show(): void;
};

type Events = {
    "tick": [(delta: number) => void],
    "collision": [shapeA: shapes.Shape, shapeB: shapes.Shape, () => void]
};

type Event = keyof Events;
type SliceLast<T extends any[]> = T extends [...infer R, any] ? R : never;


export type TextRecord = {
    text: string,
    x: number,
    y: number,
    font: Font,
    color: number,
    wrap: boolean,
    rotation: number
};

export class GameLoop {
    scene: shapes.Collection;
    texts: Set<TextRecord> = new Set();
    display: DisplayLike;
    renderer: Renderer;

    private onTick?: (delta: number) => void;
    private collisions: Map<[shapes.Shape, shapes.Shape], [() => void, boolean]> = new Map();

    constructor(display: DisplayLike) {
        this.display = display;
        this.scene = new shapes.Collection({ x: 0, y: 0 });
        this.renderer = new Renderer(this.display.width, this.display.height, Format.RGB_888, this.display.rotation);

        let then = Date.now();
        setInterval(() => {
            const now = Date.now();
            const delta = now - then;
            then = now;

            this.collisions.forEach((val, [a, b]) => {
                const curr = a.intersects(b);
                if (curr && !val[1]) {
                    val[0]();
                }
                val[1] = curr;
            });
            this.onTick?.(delta);
            this.renderer.render(this.scene, this.display.frame, true);
            this.texts.forEach(({ text, x, y, font, color, rotation, wrap }) => {
                this.renderer.drawText(this.display.frame, text, x, y, font, color, wrap, rotation);
            });
            this.display.show();
        }, 0);
    }

    /**
     * Adds a shape to the scene.
     * @param obj The shape to add.
     */
    addShape(obj: shapes.Shape) { this.scene.add(obj); }
    removeShape(obj: shapes.Shape) { this.scene.remove(obj); }

    drawText(record: TextRecord): TextRecord;
    drawText(text: string, x: number, y: number, font: Font, color: number, wrap?: boolean, rotation?: number): TextRecord;
    drawText(...args: [TextRecord] | [string, number, number, Font, number, boolean?, number?]): TextRecord {
        if (args.length === 1) {
            const [rec] = args;
            this.texts.add(rec);
            return rec;
        }
        const [text, x, y, font, color, wrap = false, rotation = 0] = args;
        let rec = { text, x, y, font, color, wrap, rotation };
        this.texts.add(rec);
        return rec;
    }
    removeText(rec: TextRecord) {
        this.texts.delete(rec);
    }
    clearText() {
        this.texts.clear();
    }


    /**
     * Registers an event listener for the specified event.
     * @param event "tick"
     * @param callback The callback function to be called on each tick.
     */
    on(event: "tick", callback: (delta: number) => void): void;
    /**
     * Registers an event listener for the specified event.
     * @param event "collision"
     * @param a The first shape to check for collision.
     * @param b The second shape to check for collision.
     * @param callback The callback function to be called when the two shapes collide.
     */
    on(event: "collision", a: shapes.Shape, b: shapes.Shape, callback: () => void): void;
    on<E extends Event>(event: E, ...args: Events[E]): void {
        if (event === "collision") {
            const [shapeA, shapeB, callback] = args as [shapes.Shape, shapes.Shape, () => void];
            this.collisions.set([shapeA, shapeB], [callback, false]);
            return;
        }
        if (event === "tick") {
            const [callback] = args as [(delta: number) => void];
            this.onTick = callback;
            return;
        }
    }

    /**
     * Removes an event listener for the specified event.
     */
    off(event: "tick"): void;
    off(event: "collision", a: shapes.Shape, b: shapes.Shape): void;
    off<E extends Event>(event: E, ...args: SliceLast<Events[E]>): void {
        if (event === "collision") {
            const [shapeA, shapeB] = args as [shapes.Shape, shapes.Shape];
            this.collisions.delete([shapeA, shapeB]);
            return;
        }
        if (event === "tick") {
            this.onTick = undefined;
            return;
        }
    }

    /**
     * Clears the scene and removes all event listeners.
     */
    clear() {
        this.scene.clear();
        this.collisions.clear();
    }
}
