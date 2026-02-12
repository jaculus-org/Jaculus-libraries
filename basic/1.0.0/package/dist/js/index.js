export function forever(fn) {
    (async () => {
        while (true) {
            await fn();
            await sleep(0);
        }
    })();
}
