import * as shapes from "shapes";
import { Renderer, Format } from "renderer";


type DisplayLike = {
    width: number;
    height: number;
    frame: ArrayBuffer;
    show(): void;
};

type Events = {
    "tick": [(delta: number) => void],
    "collision": [shapeA: shapes.Shape, shapeB: shapes.Shape, () => void]
};

type Event = keyof Events;
type SliceLast<T extends any[]> = T extends [...infer R, any] ? R : never;


export class GameLoop {
    scene: shapes.Collection;
    display: DisplayLike;
    renderer: Renderer;

    private onTick?: (delta: number) => void;
    private collisions: Map<[shapes.Shape, shapes.Shape], [() => void, boolean]> = new Map();

    constructor(display: DisplayLike) {
        this.display = display;
        this.scene = new shapes.Collection({ x: 0, y: 0 });
        this.renderer = new Renderer(this.display.width, this.display.height);

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
            this.renderer.render(this.scene, this.display.frame, true, Format.RGB_888);
            this.display.show();
        }, 0);
    }

    addShape(obj: shapes.Shape) { this.scene.add(obj); }
    removeShape(obj: shapes.Shape) { this.scene.remove(obj); }

    on(event: "tick", callback: (delta: number) => void): void;
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
}
