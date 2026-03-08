export type Handler = () => Promise<void>;
export declare function forever(fn: Handler): void;
