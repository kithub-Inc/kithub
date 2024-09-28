/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import express, { Express, Request, Response } from 'express';
// import limit from 'express-rate-limit';
import multer from 'multer';
import chalk from 'chalk';
import cors from 'cors';

interface Service {
    service: (req: Request, res: Response) => (url: string) => void;
}

interface Route {
    method: `get` | `post`;
    url: string;
    constructor: Service;
}

class Controller {
    application: Express = express();
    routes: Route[] = [];
    port: number = 3030;

    public constructor() {
        /**
         * 
         */

        // this.application.set('trust proxy', true);
        this.application.use(cors());
        this.application.use(express.json());
        this.application.use(express.urlencoded({ extended: false }));
        // this.application.use(limit({
        //     windowMs: 60 * 1000,
        //     max: 100,
        //     handler(req, res) {
        //         res.status(400).json({ code: 400, message: `요청이 제한되었습니다. 나중에 다시 시도해주세요.` });
        //     },
        // }));
    }

    public Service(method: `get` | `post`, url: string): Function {
        return (constructor: Service) => {
            this.routes = [...this.routes, { method, url, constructor }];
        };
    }

    public setRoutes(): void {
        const { application: self } = this;

        this.routes.forEach((route: Route) => self[route.method](route.url, multer({ dest: `data/uploads` }).single(`image`), (req: Request, res: Response) => {
            console.log(`${chalk.green(req.method.toUpperCase())} | ${chalk.underline(req.url)} (${req.ip})`);
            route.constructor.service(req, res);
        }));
    }

    public spawnListen(): void {
        const { application: self } = this;

        self.listen(this.port, () => {
            console.clear();
            console.log(chalk.underline(`localhost:${this.port}`));
        });
    }
}

export { Service, Route, Controller };