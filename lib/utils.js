import chalk from 'chalk';
import ora from 'ora';
export const logger = {
    info: (msg) => console.log(chalk.blue('ℹ') + ' ' + msg),
    success: (msg) => console.log(chalk.green('✔') + ' ' + msg),
    warn: (msg) => console.log(chalk.yellow('⚠') + ' ' + msg),
    error: (msg) => console.log(chalk.red('✖') + ' ' + msg),
};
export const spinner = ora();
