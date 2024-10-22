"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const express_1 = __importDefault(require("express"));
// import limit from 'express-rate-limit';
const multer_s3_1 = __importDefault(require("multer-s3"));
const multer_1 = __importDefault(require("multer"));
const chalk_1 = __importDefault(require("chalk"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
class Controller {
    constructor() {
        /**
         *
         */
        this.application = (0, express_1.default)();
        this.routes = [];
        this.port = 3030;
        // this.application.set('trust proxy', true);
        this.application.use((0, cors_1.default)());
        this.application.use(express_1.default.json());
        this.application.use(express_1.default.urlencoded({ extended: false }));
        // this.application.use(limit({
        //     windowMs: 60 * 1000,
        //     max: 100,
        //     handler(req, res) {
        //         res.status(400).json({ code: 400, message: `요청이 제한되었습니다. 나중에 다시 시도해주세요.` });
        //     },
        // }));
    }
    Service(method, url) {
        return (constructor) => {
            this.routes = [...this.routes, { method, url, constructor }];
        };
    }
    setRoutes(r2) {
        const { application: self } = this;
        const upload = (0, multer_1.default)({
            storage: (0, multer_s3_1.default)({
                s3: r2,
                bucket: `object-storage`,
                acl: `public-read`,
                contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
                key(req, file, cb) {
                    cb(null, `uploads/${Date.now()}_${path_1.default.basename(file.originalname)}`);
                }
            }),
            limits: { fileSize: 5 * 1024 * 1024 }
        });
        this.routes.forEach((route) => self[route.method](route.url, upload.single(`image`), (req, res) => {
            console.log(`${chalk_1.default.green(req.method.toUpperCase())} | ${chalk_1.default.underline(req.url)} (${req.ip})`);
            route.constructor.service(req, res, req.file);
        }));
    }
    spawnListen() {
        const { application: self } = this;
        self.listen(this.port, () => {
            console.clear();
            console.log(chalk_1.default.underline(`localhost:${this.port}`));
        });
    }
}
exports.Controller = Controller;
