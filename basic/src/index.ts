export type Handler = () => Promise<void>;

export function forever(fn: Handler): void {
  (async () => {
    while (true) {
      await fn();
      await sleep(0);
    }
  })();
}
