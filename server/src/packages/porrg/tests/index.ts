import { Lexer } from '../lib/Lexer';
import { Parser } from '../lib/Parser';
import { Interpreter } from '../lib/Interpreter';

import { Event } from '@/functions/runner';

console.clear();

const events: Event[] = [];

const code = `
function firstEvent() {
    @RepositoryEdit => (
        repo_id: 1,
        repo_description: '수정댐'
    );

    print '대충 첫번 째 api 호출';
}

function secondEvent() {
    @CreatePackage => (
        branch_id: 1,
        package_name: 'v1.0',
        package_description: '대충 버전 1 올라감',
        package_version: '1.0.0',
        package_tag: ['release'],
    );

    print '대충 두번 째 api 호출';
}

function app() {
    print '엄준식은 살아있다';

    return #Text => (
        text: '그렇다네요'
    );
}

export { app, firstEvent, secondEvent };
`;

const lexer = new Lexer(code);
const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parse();

const interpreter = new Interpreter();
interpreter.interpret(ast, 'main.porrg', true);

const app = interpreter.currentExports.app;
delete interpreter.currentExports.app;

for (const key of Object.keys(interpreter.currentExports)) {
    const value = interpreter.currentExports[key];
    value();
}

events.push({
    functions: Object.keys(interpreter.currentExports),
    logs: interpreter.logs,
    layout: app()
});

console.log(events);
