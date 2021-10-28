import Deferred from "./Deferred.js";
import Queue from "./Queue.js";
import assert from "./assert.js";

class PendingPromise<T> {
    static start<T>(func: () => Promise<T> | T): PendingPromise<T> {
        try {
            return new PendingPromise(Promise.resolve(func()));
        } catch (error: any) {
            return new PendingPromise(Promise.reject(error));
        }
    }

    readonly #promise: Promise<T>;

    constructor(promise: Promise<T>) {
        promise.catch(() => {});
        this.#promise = promise;
    }

    get promise(): Promise<T> {
        return this.#promise;
    }
}

export default class ConcurrentTaskManager<T> {
    static async forEach<T>(
        items: AsyncIterable<T> | Iterable<T>,
        concurrency: number,
        callback: (value: T) => any,
    ): Promise<void> {
        const manager = new ConcurrentTaskManager<T>();

        for await (const item of items) {
            manager.start(() => callback(item));
            if (manager.remainingTasks >= concurrency) {
                await manager.takeAny();
            }
        }

        await manager.flush();
    }

    readonly #pendingPromises = new Set<PendingPromise<T>>();
    readonly #completeTasks = new Set<PendingPromise<T>>();
    readonly #pendingRequests = new Queue<Deferred<T>>();

    #onDone(task: PendingPromise<T>): void {
        this.#pendingPromises.delete(task);
        if (this.#pendingRequests.size > 0) {
            assert(this.#completeTasks.size === 0);
            const pendingRequest = this.#pendingRequests.dequeue();
            pendingRequest.resolve(task.promise);
        } else {
            this.#completeTasks.add(task);
        }
    }

    get remainingTasks(): number {
        return this.#pendingPromises.size + this.#completeTasks.size;
    }

    start(startTask: () => Promise<T>): PendingPromise<T> {
        const task = PendingPromise.start(startTask);
        this.#pendingPromises.add(task);
        task.promise.finally(() => void this.#onDone(task));
        return task;
    }

    async #takeAny(): Promise<T> {
        const [task] = this.#completeTasks;
        if (task) {
            this.#completeTasks.delete(task);
            assert(this.#pendingRequests.isEmpty);
            return await task.promise;
        }
        const deferred = new Deferred<T>();
        this.#pendingRequests.enqueue(deferred);
        return await deferred.promise;
    }

    async takeAny(): Promise<T> {
        return await this.#takeAny();
    }

    async flush(): Promise<Array<T>> {
        const results: Array<T> = [];
        while (this.#pendingPromises.size > 0 || this.#completeTasks.size > 0) {
            results.push(await this.#takeAny());
        }
        return results;
    }
}
