#!/usr/bin/env node

import chalk from "chalk";

// We will import the compiled JS from lib/index.js after building
try {
  // Dynamic import to handle the fact that lib might not exist yet during dev
  const mainModule = await import("../lib/cli/index.js");
  const main = mainModule.default;

  // Show welcome banner
  const bannerModule = await import("../lib/utils/banner.js");
  bannerModule.showBanner();

  await main();
} catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND") {
    console.log(chalk.red("❌ Please build the project first: npm run build"));
    console.error(error); // Helpful for debugging
  } else {
    console.error(chalk.red("❌ Error:"), error);
  }
}
