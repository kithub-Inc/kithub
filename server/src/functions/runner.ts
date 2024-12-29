import { Ast } from '@/types/declare';

import dotenv from 'dotenv';

import { Interpreter } from '@/packages/porrg/lib/Interpreter';
import { Statement } from '@/packages/porrg/types/interfaces';
import { mysql } from '@/index';

dotenv.config();

export interface Event {
    functions: string[],
    logs: string[],
    layout: object;
}

export enum EventType {
    OnRepositoryCreate = 'OnRepositoryCreate',
    OnRepositoryEdit = 'OnRepositoryEdit',
    OnBranchCreate = 'OnBranchCreate',
    OnCommit = 'OnCommit'
}

export const runner = async (user_email: string, event_type: string) => {
    const asts = await mysql.execute<Ast[][]>(
        'SELECT * FROM event WHERE user_email = ? AND type = ?',
        [user_email, event_type]
    );

    if (!asts?.[0]) return 'This is a non-existent event.';

    const events: Event[] = [];

    try {
        for (const ast of asts[0]) {
            const interpreter = new Interpreter();
            interpreter.interpret(
                JSON.parse(ast.content) as Statement[],
                'main.porrg',
                true
            );
    
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
        }

        return events;

    } catch {
        return 'Invalid event properties.';
    }
}
