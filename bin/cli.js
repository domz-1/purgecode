#!/usr/bin/env node

import chalk from "chalk";

try {
  const mainModule = await import("../lib/cli/index.js");
  const main = mainModule.default;
  await main();
} catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND") {
    console.log(chalk.red("❌ Please build the project first: npm run build"));
    console.error(error);
  } else {
    console.error(chalk.red("❌ Error:"), error);
  }
}
