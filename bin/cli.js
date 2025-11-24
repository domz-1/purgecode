#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// We will import the compiled JS from lib/index.js after building
try {
  // Dynamic import to handle the fact that lib might not exist yet during dev
  const mainModule = await import('../lib/index.js');
  const main = mainModule.default;
  await main();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.log('Please build the project first: npm run build');
    console.error(error); // Helpful for debugging
  } else {
    console.error(error);
  }
}
