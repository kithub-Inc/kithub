import express from 'express';
import c from 'chalk';

import { Funk } from '@/packages/framework/funk';

interface FrameworkProps {
    port?: number;
}

export class Framework {
    public app: express.Express;
    public port: number;
    public funk!: Funk;

    public constructor({ port }: FrameworkProps) {
        this.app = express();
        this.port = port || 3000;

        console.clear();
        console.log(c`{bgYellow  warn } {yellow beta version can pose a huge risk.}`);
    }

    public opener() {
        this.app.listen(8080, () => {
            console.log(c`{gray [}{cyan opener}{gray ]} {underline http://localhost:${this.port}}\n`);
        });
    }
}
