// This entire file is never imported anywhere
// Should be detected as unused file

export const unusedExport = 'This file is never used';

export function neverCalled() {
    return 'nobody imports this';
}

export class NeverInstantiated {
    doSomething() {
        return 'unused';
    }
}
