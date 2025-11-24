// File with mixed issues - imports, variables, console, comments
import { useState, useEffect, useCallback } from 'react';
import lodash from 'lodash';
import * as path from 'path';

// This is a comment
const UNUSED = 'unused';
let unusedVar = 123;

/* Multi-line comment
   to be removed */
console.log('Debug log');

// Unused function
function helper() {
    console.warn('Warning');
    return 'unused';
}

// TODO: Remove this
export const actualCode = () => {
    console.log('Starting');
    // Using only one import
    const [state] = useState(0);
    console.error('Error happened');
    return state;
};

// FIXME: This is broken
const broken = {
    // Comment in object
    value: 123
};

console.info('Info log');
