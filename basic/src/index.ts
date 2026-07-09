export type Handler = () => Promise<void>;

export function forever(fn: Handler): void {
    (async () => {
        while (true) {
            await fn();
            await sleep(0);
        }
    })().catch(console.error);
}

export function onStart(fn: Handler): void {
    fn().catch(console.error);
}
