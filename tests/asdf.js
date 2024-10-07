const highlight = require('cli-highlight').highlight;
const fs = require('fs');

// 예시로 자바스크립트 코드를 파일에서 읽음
const code = `const Diff = require(\`diff\`);
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

console.log(highlight(code, { language: 'javascript', theme: { keyword: 'blue', string: 'green', function: 'cyan' }}));