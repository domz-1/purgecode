// codeprune-ignore
import { something } from 'fake-package';

console.log('This file should be completely ignored');
// All these issues should stay
const unused = 'stays';

/* Comment stays */
function unusedFunc() {
    console.warn('Stays');
}
