
export default class Queue<T> {
    readonly #queue = new Set<{ value: T }>();

    get size(): number {
        return this.#queue.size;
    }

    get isEmpty(): boolean {
        return this.#queue.size === 0;
    }

    enqueue(value: T): void {
        this.#queue.add({ value });
    }

    dequeue(): T {
        const [first] = this.#queue;
        if (first === undefined) {
            throw new TypeError("Cannot dequeue from empty Queue");
        }
        this.#queue.delete(first);
        return first.value;
    }
}
