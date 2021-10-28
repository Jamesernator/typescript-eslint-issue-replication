
export default class Deferred<T> {
    readonly #promise: Promise<T>;
    readonly #resolve!: (value: T | Promise<T>) => void;
    readonly #reject!: (error: any) => void;

    constructor() {
        let resolve: (value: T) => void;
        let reject: (error: any) => void;

        this.#promise = new Promise((resolve_, reject_) => {
            resolve = resolve_;
            reject = reject_;
        });

        this.#resolve = resolve! as any;
        this.#reject = reject!;
    }

    get promise(): Promise<T> {
        return this.#promise;
    }

    get resolve(): (value: T | Promise<T>) => void {
        return this.#resolve;
    }

    get reject(): (error: any) => void {
        return this.#reject;
    }
}
