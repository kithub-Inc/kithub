/* eslint-disable @typescript-eslint/no-explicit-any */

import Express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import c from 'chalk';

import { Response } from '@/packages/response';

type Method = 'get' | 'post' | 'delete' | 'patch' | 'put';
type FunkService = new () => {
    service: (req: Express.Request, res: Express.Response) => void;
    [key: string]: any;
};

type ServiceParamType = 'body' | 'query';
interface ServiceParam {
    type: ServiceParamType;
    required: boolean;
    name: string;
    validate: RegExp | string;
}
interface Log {
    activate: boolean;
    save: boolean;
    text?: string;
    dir?: string;
}
interface Service {
    method: Method;
    url?: string;
    params?: ServiceParam[];
    
    target: FunkService;
    log: Log;
    header?: {
        [key: string]: any;
    }
}

const exists = async (path: string) => {
    try {
        return !!(await fs.stat(path));
        
    } catch {
        return false;
    }
};

export class Funk {
    private static multer: multer.Multer;
    private static app: Express.Express;
    private static port: number;

    public static services: Service[] = [];
    
    private static logsFileName: string;
    private static index: number;
    private static token: string;

    public constructor(app: Express.Express, port: number) {
        Funk.app = app;
        Funk.port = port;
        Funk.logsFileName = `${new Date().toISOString()}.log`;
        Funk.index = 0;

        Funk.app.use(Express.json());
        Funk.app.use(Express.urlencoded({ extended: true }));

        Funk.multer = multer({
            storage: multer.diskStorage({
                destination(req, file, callback) {
                    callback(null, 'uploads/');
                },
                filename(req, file, callback) {
                    const ext = path.extname(file.originalname);
                    callback(null, path.basename(file.originalname, ext) + ext);
                }
            })
        });
    }

    public static get half() {
        return Math.floor((process.stdout.columns - 1) / 2);
    }

    public static Get(target: FunkService) { Funk.services.push({ method: 'get', target, log: { activate: false, save: false } }); }
    public static Post(target: FunkService) { Funk.services.push({ method: 'post', target, log: { activate: false, save: false } }); }
    public static Delete(target: FunkService) { Funk.services.push({ method: 'delete', target, log: { activate: false, save: false } }); }
    public static Patch(target: FunkService) { Funk.services.push({ method: 'patch', target, log: { activate: false, save: false } }); }
    public static Put(target: FunkService) { Funk.services.push({ method: 'put', target, log: { activate: false, save: false } }); }

    private static Param(type: ServiceParamType, required: boolean = false, name: string, validate: RegExp | string) {
        return (target: FunkService) => {
            Funk.services.forEach(s => {
                if (s.target === target) {
                    if (!s.params) s.params = [];
                    s.params.push({ type, required, name, validate });
                }
            });
        };
    }

    public static Body(required: boolean = false, name: string, validate: RegExp | string) { return Funk.Param('body', required, name, validate); }
    public static Query(required: boolean = false, name: string, validate: RegExp | string) { return Funk.Param('query', required, name, validate); }

    public static Service(url: string) {
        return (target: FunkService) => {
            const t = Funk.services.find(s => {
                s.url = url;
                return s.target === target;
            });
            if (!t) throw new Error('존재하지 않는 클래스');

            const td = new t.target();
            Funk.app[t.method](url, this.multer.array('files'), async (req, res) => {
                try {
                    if (t.params) {
                        for (const param of t.params) {
                            if (param.required && !req[param.type][param.name]) {
                                const response = new Response();
                                response.status = 400;
                                response.message = `(${param.type}) '${param.name}' is not exists.`;
    
                                res.send(response.json());
                                return;
                            }
    
                            if (
                                req[param.type][param.name] &&
                                (
                                    typeof param.validate === 'string' ?
                                    typeof req[param.type][param.name] !== param.validate :
                                    !param.validate.test(req[param.type][param.name])
                                )
                            ) {
                                const response = new Response();
                                response.status = 400;
                                response.message = `(${param.type}) '${param.name}' is not valid.`;
    
                                res.send(response.json());
                                return;
                            }
    
                            td[param.name] = req[param.type][param.name];
                        }
                    }
    
                    if (t.log.activate) {
                        const text = t.log.text
                            ?.replace('!(method)', t.method)
                            ?.replace('!(url)', req.url || '');
                        
                        const newText = c`{gray [}{cyan log}{gray ]} ${text}\n`;
                        process.stdout.write(`\x1b[${Funk.index + 4};${1}H${newText}`);
                        Funk.index++;
    
                        if (t.log.save) {
                            if (!t.log.dir) throw new Error('로그 디렉터리가 존재하지 않음.');
                            if (!await exists(t.log.dir) || !(await fs.lstat(t.log.dir)).isDirectory()) await fs.mkdir(t.log.dir, { recursive: true });
    
                            let prevLogs: string = `[${new Date().toISOString()}]`;
                            if (await exists(`${t.log.dir}/${Funk.logsFileName}`)) prevLogs = await fs.readFile(`${t.log.dir}/${Funk.logsFileName}`, 'utf-8');
                            fs.writeFile(`${t.log.dir}/${Funk.logsFileName}`, `${prevLogs}\n\n[${new Date().toISOString()}] ${t.method} ${t.url}\nbody: ${JSON.stringify(req.body, null, 4)}\nparams: ${JSON.stringify(req.params, null, 4)}`);
                        }
                    }
    
                    await td.service(req, res);

                } catch {
                    res.send({ status: 404, message: 'server error.', data: null });
                }
            });
        };
    }

    public static Auth(token: string) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (_: FunkService) => {
            Funk.token = token;
        }
    }

    public static Fetch<T>(body: T) {
        return (target: FunkService) => {
            const t = Funk.services.find(s => s.target === target);
            if (!t) throw new Error('존재하지 않는 클래스');

            (async () => {
                if (!t.url) throw new Error('존재하지 않는 경로');
                let response: globalThis.Response;

                if (t.method === 'get') {
                    const query = Object.keys(body as object).map(e => {
                        const value = body[e as keyof typeof body];
                        return `${e}=${value}`;
                    }).join('&');

                    response = await fetch(`http://localhost:${Funk.port}${t.url}?${query}`, {
                        method: t.method.toUpperCase(),
                        headers: {
                            "Authorization": `Bearer ${Funk.token}`
                        }
                    });

                } else {
                    response = await fetch(`http://localhost:${Funk.port}${t.url}`, {
                        method: t.method.toUpperCase(),
                        headers: {
                            "Content-Type": 'application/json',
                            "Authorization": `Bearer ${Funk.token}`
                        },
                        body: JSON.stringify(body)
                    });
                }
                
                const text = await response.text();

                for (let y = 0; y < process.stdout.columns - 1; y++) process.stdout.write(`\x1b[${y};${Funk.half}H|`);
                
                for (let y = 0; y < text.split('\n').length; y++) {
                    const newText = text.split('\n')[y];
                    const finalText = newText.length < Funk.half - 10 ?
                        newText : 
                        newText.substring(0, Funk.half - 10)
                        + '...'
                        + newText.substring(newText.length - 1, newText.length);
                    
                    process.stdout.write(`\x1b[${y + 2};${Funk.half + 4}H${finalText}`);
                    process.stdout.write(`\x1b[${process.stdout.rows - 1};0H`);
                }
            })();
        }
    }

    public static Logger({ save = false, text, dir }: { save: boolean; text?: string; dir?: string; }) {
        return (target: FunkService) => {
            const t = Funk.services.find(s => s.target === target);
            if (!t) throw new Error('존재하지 않는 클래스');

            t.log.text = text || c`{green !(method)} {underline !(url)}`;
            t.log.dir = dir || './logs';
            t.log.activate = true;
            t.log.save = save;
        }
    }

    public static Header(key: string, value: string) {
        return (target: FunkService) => {
            const t = Funk.services.find(s => s.target === target);
            if (!t) throw new Error('존재하지 않는 클래스');

            if (!t.header) t.header = {};
            t.header[key] = value;
        }
    }
};
