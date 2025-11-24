// File to test unused variable removal
const UNUSED_CONSTANT = 'never used';
let unusedLet = 42;
var unusedVar = 'old style';

const unusedObject = {
    prop1: 'value1',
    prop2: 'value2',
    nested: {
        deep: 'value'
    }
};

const unusedArray = [1, 2, 3, 4, 5];

let anotherUnused = 'test';
const yetAnotherUnused = () => 'function';

// Only this is used
export const usedVariable = 'I am used';
