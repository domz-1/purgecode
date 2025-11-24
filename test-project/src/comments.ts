// File to test comment removal
// This is a single line comment that should be removed
// Another comment here
/* This is a multi-line comment
   that spans multiple lines
   and should be removed */

/**
 * This is a JSDoc comment
 * It should also be removed
 * @param value - some value
 */
export function testFunction(value: number) {
    // Inline comment
    const result = value * 2; // End of line comment

    /* Block comment in the middle */
    return result;
}

// TODO: This is a todo comment
// FIXME: This needs fixing
// NOTE: Important note here

/*
 * Multi-line block comment
 * with asterisks
 */
export const data = {
    // Comment in object
    prop1: 'value1', // Another comment
  /* block */ prop2: 'value2'
};

// Commented out code:
// function oldFunction() {
//   return 'old';
// }

// export const deprecated = 'old';
