const Diff = require(`diff`);
const chalk = require(`chalk`);

const string1 = `const Diff = require(\`diff\`);
const chalk = require(\`chalk\`);

(async () => {
    const string1 = \`\`;
    const string2 = \`\`;

    const diffResult = Diff.diffWords(string1, string2);

    diffResult.forEach(part => {
        if (part.added) process.stdout.write(chalk.green(part.value));
        else if (part.removed) process.stdout.write(chalk.red(part.value));
        else process.stdout.write(chalk.grey(part.value));
    });

    console.log();
});`;

const string2 = `// module import (commonjs => esmodule)
import Diff from 'diff';
import chalk from 'chalk';

const string1 = \`abc\`;
const string2 = \`\`;

const diffResult = Diff.diffWords(string1, string2);

diffResult.forEach(part => {
    if (part.added) process.stdout.write(chalk.green(part.value));
    else if (part.removed) process.stdout.write(chalk.red(part.value));
    else process.stdout.write(chalk.grey(part.value));
});

console.log();`;

const diffResult = Diff.diffWords(string1, string2);

diffResult.forEach(part => {
    if (part.added) process.stdout.write(chalk.green(part.value));
    else if (part.removed) process.stdout.write(chalk.red(part.value));
    else process.stdout.write(chalk.grey(part.value));
});

console.log();