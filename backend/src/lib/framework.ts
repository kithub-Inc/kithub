/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import express, { Express, Request, Response } from 'express';
// import limit from 'express-rate-limit';
import multerS3 from 'multer-s3';
import multer from 'multer';
import chalk from 'chalk';
import cors from 'cors';
import path from 'path';

interface Service {
    service: (req: Request, res: Response, name?: any) => (url: string) => void;
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

    public setRoutes(r2: any): void {
        const { application: self } = this;

        const upload = multer({
            storage: multerS3({
                s3: r2,
                bucket: `object-storage`,
                acl: `public-read`,
                contentType: multerS3.AUTO_CONTENT_TYPE,
                key(req, file, cb) {
                    cb(null, `uploads/${Date.now()}_${path.basename(file.originalname)}`);
                }
            }),
            limits: { fileSize: 200 * 1024 * 1024 }
        });

        this.routes.forEach((route: Route) => self[route.method](route.url, upload.single(`image`), (req: Request, res: Response) => {
            console.log(`${chalk.green(req.method.toUpperCase())} | ${chalk.underline(req.url)} (${req.ip})`);
            route.constructor.service(req, res, (req.file as any));
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