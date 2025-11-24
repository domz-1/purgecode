// File to test unused import removal
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as fs from 'fs';
import { join, resolve, dirname } from 'path';
import lodash from 'lodash';
import { something, another, yetAnother } from './nonexistent';

// Only using one import
export const test = () => {
    const [count, setCount] = useState(0);
    return count;
};
