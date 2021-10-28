
export class AssertionError extends Error {
    name = "AssertionError";
}

export default function assert(
    boolean: boolean,
    message: string="Assertion failed",
): asserts boolean {
    if (!boolean) {
        throw new AssertionError(message);
    }
}
