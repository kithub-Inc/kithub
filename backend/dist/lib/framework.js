"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const express_1 = __importDefault(require("express"));
// import limit from 'express-rate-limit';
const multer_1 = __importDefault(require("multer"));
const chalk_1 = __importDefault(require("chalk"));
const cors_1 = __importDefault(require("cors"));
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
    setRoutes() {
        const { application: self } = this;
        this.routes.forEach((route) => self[route.method](route.url, (0, multer_1.default)({ dest: `data/uploads` }).single(`image`), (req, res) => {
            console.log(`${chalk_1.default.green(req.method.toUpperCase())} | ${chalk_1.default.underline(req.url)} (${req.ip})`);
            route.constructor.service(req, res);
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
