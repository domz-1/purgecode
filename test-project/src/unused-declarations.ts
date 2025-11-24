// File to test unused declaration removal

// Unused function
function unusedFunction() {
    return 'never called';
}

// Unused class
class UnusedClass {
    private value: number;

    constructor(val: number) {
        this.value = val;
    }

    getValue() {
        return this.value;
    }
}

// Unused interface
interface UnusedInterface {
    id: number;
    name: string;
    email: string;
    age?: number;
}

// Unused type
type UnusedType = {
    foo: string;
    bar: number;
    baz?: boolean;
};

// Unused enum
enum UnusedEnum {
    First = 'FIRST',
    Second = 'SECOND',
    Third = 'THIRD'
}

// Unused arrow function
const unusedArrow = (x: number) => x * 2;

// Unused async function
async function unusedAsync() {
    return await Promise.resolve('unused');
}

// Actually used - should stay
export function usedFunction() {
    return 'I am used';
}

export interface UsedInterface {
    id: number;
}
