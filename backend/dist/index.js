"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-escape */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jwt_1 = require("./lib/jwt");
const framework_1 = require("./lib/framework");
const mysql_1 = require("./lib/mysql");
const mysql = new mysql_1.Mysql();
const Control = new framework_1.Controller();
const transporter = nodemailer_1.default.createTransport({
    host: `smtp.gmail.com`,
    port: 587,
    secure: false,
    auth: {
        user: process.env.GOOGLE_APP_EMAIL,
        pass: process.env.GOOGLE_APP_KEY
    }
});
const recursion = (path) => {
    const data = [];
    fs_1.default.readdirSync(`${path}`).forEach(name => {
        let type = `file`;
        let content = ``;
        if (fs_1.default.lstatSync(`${path}/${name}`).isDirectory()) {
            content = recursion(`${path}/${name}`);
            type = `folder`;
        }
        else
            content = fs_1.default.readFileSync(`${path}/${name}`, `utf-8`);
        data.push({ name, type, content });
    });
    return data;
};
let OauthOTP = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/otp`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthOTP = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `로그인 실패` };
                const result = yield mysql.execute(`SELECT * FROM otps WHERE user_email = ? AND code = ?`, [req.body.user_email, req.body.code]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const data = result[0][0];
                    yield mysql.execute(`DELETE FROM otps WHERE node_id = ?`, [data.node_id]);
                    const device = yield mysql.execute(`SELECT * FROM user_device WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
                    if (device && Array.isArray(device[0]) && device[0][0])
                        yield mysql.execute(`UPDATE user_device SET updated_at = NOW() WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
                    else
                        yield mysql.execute(`INSERT INTO user_device (user_email, device_agent) VALUES (?, ?)`, [req.body.user_email, req.headers[`user-agent`]]);
                    response.status = 200;
                    response.message = `로그인 성공`;
                    response.data = { accessToken: (0, jwt_1.accessToken)(data.user_email) };
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "OauthOTP");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OauthOTP = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OauthOTP = _classThis;
})();
let OauthSignIn = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/signin`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthSignIn = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `인증메일 전송 실패` };
                if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
                    const result = yield mysql.execute(`SELECT * FROM users WHERE user_email = ? AND user_password = ?`, [req.body.user_email, crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
                    if (result && Array.isArray(result[0]) && result[0][0]) {
                        const data = result[0][0];
                        const code = otp_generator_1.default.generate(4, { upperCaseAlphabets: false, specialChars: false });
                        yield mysql.execute(`INSERT INTO otps (user_email, code) VALUES (?, ?)`, [data.user_email, code]);
                        transporter.sendMail({
                            from: process.env.GOOGLE_APP_EMAIL,
                            to: data.user_email,
                            subject: `[kithub-inc] 킷허브 이메일 2차 인증`,
                            html: `인증코드: ${code}`
                        });
                        response.status = 200;
                        response.message = `인증메일 전송 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "OauthSignIn");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OauthSignIn = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OauthSignIn = _classThis;
})();
let OauthSignUp = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/signup`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthSignUp = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `회원가입 실패` };
                if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
                    const result = yield mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.body.user_email]);
                    if (result && Array.isArray(result[0]) && !result[0][0]) {
                        const insert = yield mysql.execute(`INSERT INTO users (user_email, user_password) VALUES (?, ?)`, [req.body.user_email, crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
                        fs_1.default.mkdirSync(`data/${req.body.user_email}`, { recursive: true });
                        if (insert) {
                            response.status = 200;
                            response.message = `회원가입 성공, 로그인 필요`;
                        }
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "OauthSignUp");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OauthSignUp = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OauthSignUp = _classThis;
})();
let OauthVerify = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/verify`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthVerify = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                res.setHeader(`Content-type`, `application/json`);
                const response = (0, jwt_1.verify)(req.body.accessToken);
                response.status = 400;
                response.message = `로그인 정보 확인 실패`;
                if ((_a = response.data) === null || _a === void 0 ? void 0 : _a.user_email) {
                    let result;
                    if (!req.body.agent)
                        result = yield mysql.execute(`SELECT U.* FROM users AS U JOIN user_device AS UD ON U.user_email = UD.user_email WHERE U.user_email = ? AND UD.device_agent = ?`, [response.data.user_email, req.headers[`user-agent`]]);
                    else
                        result = yield mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [response.data.user_email]);
                    if (result && Array.isArray(result[0]) && result[0][0]) {
                        const data = result[0][0];
                        data.user_password = `(secure)`;
                        response.status = 200;
                        response.message = `로그인 정보 확인 성공`;
                        response.data = data;
                    }
                    else {
                        response.data = {};
                    }
                }
                res.send(JSON.stringify(response));
                return response;
            });
        }
    };
    __setFunctionName(_classThis, "OauthVerify");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OauthVerify = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OauthVerify = _classThis;
})();
let User = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/user/:user_email`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var User = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `유저 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.params.user_email]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    response.status = 200;
                    response.message = `유저 불러오기 성공`;
                    response.data = result[0][0];
                    response.data.user_password = `(secure)`;
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
let UserDevices = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/devices`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserDevices = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `디바이스 목록 불러오기 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`SELECT * FROM user_device WHERE user_email = ?`, [verify.data.data.user_email]);
                    if (result && Array.isArray(result[0])) {
                        response.status = 200;
                        response.message = `디바이스 목록 불러오기 성공`;
                        response.data = result[0];
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserDevices");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserDevices = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserDevices = _classThis;
})();
let UserDeviceRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/device/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserDeviceRemove = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `디바이스 제거 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`DELETE FROM user_device WHERE user_email = ? AND device_agent = ?`, [verify.data.data.user_email, req.body.agent]);
                    if (result) {
                        response.status = 200;
                        response.message = `디바이스 제거 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserDeviceRemove");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserDeviceRemove = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserDeviceRemove = _classThis;
})();
let UserAlerts = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/alerts`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserAlerts = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `알림 목록 불러오기 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`SELECT * FROM user_alert WHERE user_email = ? ORDER BY created_at DESC LIMIT 5`, [verify.data.data.user_email]);
                    if (result && Array.isArray(result[0])) {
                        response.status = 200;
                        response.message = `알림 목록 불러오기 성공`;
                        response.data = result[0];
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserAlerts");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserAlerts = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserAlerts = _classThis;
})();
let UserAlert = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/alert`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserAlert = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `알림 읽기 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    req.body.ids.forEach((id) => __awaiter(this, void 0, void 0, function* () { return yield mysql.execute(`UPDATE user_alert SET alert_read = 1 WHERE node_id = ? AND user_email = ?`, [id, verify.data.data.user_email]); }));
                    response.status = 200;
                    response.message = `알림 읽기 성공`;
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserAlert");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserAlert = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserAlert = _classThis;
})();
let UserModifyAvatar = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/avatar`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyAvatar = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `아바타 수정 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email && req.file) {
                    let update;
                    let path = ``;
                    path = `/uploads/${req.file.filename}`;
                    if (path !== ``)
                        update = yield mysql.execute(`UPDATE users SET avatar_src = ? WHERE user_email = ?`, [path, req.body.user_email]);
                    if (update) {
                        response.status = 200;
                        response.message = `아바타 수정 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserModifyAvatar");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserModifyAvatar = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserModifyAvatar = _classThis;
})();
let UserModifyName = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/name`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyName = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이름 수정 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                    const update = yield mysql.execute(`UPDATE users SET user_name = ? WHERE user_email = ?`, [req.body.user_name, req.body.user_email]);
                    if (update) {
                        response.status = 200;
                        response.message = `이름 수정 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserModifyName");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserModifyName = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserModifyName = _classThis;
})();
let UserModifyPassword = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/password`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyPassword = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `비밀번호 수정 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                    const update = yield mysql.execute(`UPDATE users SET user_password = ? WHERE user_email = ?`, [crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`), req.body.user_email]);
                    if (update) {
                        response.status = 200;
                        response.message = `비밀번호 수정 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "UserModifyPassword");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserModifyPassword = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserModifyPassword = _classThis;
})();
let UserAvatar = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/:user_email/avatar`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserAvatar = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield mysql.execute(`SELECT avatar_src FROM users WHERE user_email = ?`, [req.params.user_email]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const url = path_1.default.join(`${__dirname}/../data/${result[0][0].avatar_src}`);
                    if (fs_1.default.existsSync(url)) {
                        const file = fs_1.default.readFileSync(url);
                        res.setHeader(`Content-type`, `image/png`);
                        res.send(file);
                    }
                }
            });
        }
    };
    __setFunctionName(_classThis, "UserAvatar");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UserAvatar = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UserAvatar = _classThis;
})();
let Repositories = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/:user_email/repositories`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Repositories = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `레포지토리 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.user_email = ? AND repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC`, [req.params.user_email]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `레포지토리 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "Repositories");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Repositories = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Repositories = _classThis;
})();
let Repository = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Repository = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `레포지토리 불러오기 실패` };
                const result = yield mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
                const grantes = yield mysql.execute(`SELECT RA.* FROM repository_authorities AS RA JOIN repositories AS R ON RA.repo_id = R.node_id WHERE RA.repo_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0] && grantes && Array.isArray(grantes[0])) {
                    response.status = 200;
                    response.message = `레포지토리 불러오기 성공`;
                    response.data = result[0][0];
                    response.data.repo_grantes = grantes[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "Repository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Repository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Repository = _classThis;
})();
let RepositoryGrantes = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/grantes`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryGrantes = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `권한 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_authorities WHERE repo_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `권한 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
                return response;
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryGrantes");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryGrantes = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryGrantes = _classThis;
})();
let RepositoryTopicImage = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/topic_image`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryTopicImage = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield mysql.execute(`SELECT image_src FROM repositories WHERE node_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const url = path_1.default.join(`${__dirname}/../data/${result[0][0].image_src}`);
                    if (fs_1.default.existsSync(url)) {
                        const file = fs_1.default.readFileSync(url);
                        res.setHeader(`Content-type`, `image/png`);
                        res.send(file);
                    }
                }
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryTopicImage");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryTopicImage = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryTopicImage = _classThis;
})();
let RepositoryBranches = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/branches`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranches = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `브랜치 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `브랜치 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranches");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranches = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranches = _classThis;
})();
let RepositoryBranch = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranch = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `브랜치 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    response.status = 200;
                    response.message = `브랜치 불러오기 성공`;
                    response.data = result[0][0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranch");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranch = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranch = _classThis;
})();
let RepositoryBranchDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/directory`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchDirectory = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `디렉터리 불러오기 실패` };
                const result = yield mysql.execute(`SELECT RB.*, U.user_email FROM repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.repo_id = ? AND RB.node_id = ?`, [req.params.repo_id, req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const data = result[0][0];
                    response.status = 200;
                    response.message = `디렉터리 불러오기 성공`;
                    response.data = [];
                    const lastCommit = yield mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.node_id = ? ORDER BY RB.created_at DESC LIMIT 1`, [data.node_id]);
                    if (lastCommit && Array.isArray(lastCommit[0]) && lastCommit[0][0]) {
                        const commit = lastCommit[0][0];
                        response.data = recursion(`${commit.commit_src}`);
                        response.data.sort((a, b) => {
                            if (a.type === `folder` && b.type !== `folder`)
                                return -1;
                            else if (a.type !== `folder` && b.type === `folder`)
                                return 1;
                            else
                                return 0;
                        });
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchDirectory");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchDirectory = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchDirectory = _classThis;
})();
let RepositoryBranchCommits = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/commits`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommits = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `커밋 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id WHERE RB.node_id = ? AND R.node_id = ? ORDER BY RBC.created_at DESC`, [req.params.node_id, req.params.repo_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `커밋 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchCommits");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchCommits = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchCommits = _classThis;
})();
let RepositoryBranchCommit = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommit = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `커밋 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    response.status = 200;
                    response.message = `커밋 불러오기 성공`;
                    response.data = result[0][0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchCommit");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchCommit = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchCommit = _classThis;
})();
let RepositoryBranchCommitDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommitDirectory = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `디렉터리 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const commit = result[0][0];
                    response.status = 200;
                    response.message = `디렉터리 불러오기 성공`;
                    response.data = recursion(`${commit.commit_src}`);
                    response.data.sort((a, b) => {
                        if (a.type === `folder` && b.type !== `folder`)
                            return -1;
                        else if (a.type !== `folder` && b.type === `folder`)
                            return 1;
                        else
                            return 0;
                    });
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchCommitDirectory");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchCommitDirectory = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchCommitDirectory = _classThis;
})();
let RepositoryBranchPrevCommitDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory/prev`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchPrevCommitDirectory = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `디렉터리 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_branch_commit WHERE branch_id = ? AND node_id < ? ORDER BY created_at DESC LIMIT 1`, [req.params.branch_id, Number(req.params.node_id)]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const commit = result[0][0];
                    response.status = 200;
                    response.message = `디렉터리 불러오기 성공`;
                    response.data = recursion(`${commit.commit_src}`);
                    response.data.sort((a, b) => {
                        if (a.type === `folder` && b.type !== `folder`)
                            return -1;
                        else if (a.type !== `folder` && b.type === `folder`)
                            return 1;
                        else
                            return 0;
                    });
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchPrevCommitDirectory");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchPrevCommitDirectory = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchPrevCommitDirectory = _classThis;
})();
let RepositoryIssues = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/issues`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssues = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이슈 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `이슈 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssues");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssues = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssues = _classThis;
})();
let RepositoryIssue = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssue = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이슈 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? AND node_id = ?`, [req.params.repo_id, req.params.node_id]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    response.status = 200;
                    response.message = `이슈 불러오기 성공`;
                    response.data = result[0][0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssue");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssue = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssue = _classThis;
})();
let RepositoryIssueComments = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id/comments`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueComments = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이슈 댓글 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT U.user_email, U.avatar_src, U.user_name, RIC.*, (SELECT user_email FROM repository_issue_comment AS RIC2 WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_email, (SELECT U.user_name FROM repository_issue_comment AS RIC2 JOIN users AS U ON U.user_email = RIC2.user_email WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_name FROM repository_issue_comment AS RIC JOIN users AS U ON RIC.user_email = U.user_email WHERE RIC.issue_id = ? ORDER BY RIC.created_at ASC`, [req.params.node_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `이슈 댓글 목록 불러오기 성공`;
                    response.data = [];
                    const hearts = yield mysql.execute(`SELECT RICH.*, RIC.issue_id FROM repository_issue_comment_heart AS RICH JOIN repository_issue_comment AS RIC ON RICH.comment_id = RIC.node_id WHERE RIC.issue_id = ?`, [req.params.node_id]);
                    result[0].forEach((e) => __awaiter(this, void 0, void 0, function* () {
                        if (hearts && Array.isArray(hearts[0]) && hearts[0].find((i) => i.comment_id === e.node_id))
                            response.data.push(Object.assign(Object.assign({}, e), { hearts: hearts[0].filter((i) => i.comment_id === e.node_id) }));
                        else
                            response.data.push(Object.assign(Object.assign({}, e), { hearts: [] }));
                    }));
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssueComments");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssueComments = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssueComments = _classThis;
})();
let RepositoryIssueCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/issue/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCreate = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이슈 작성 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const insert = yield mysql.execute(`INSERT INTO repository_issue (repo_id, user_email, issue_title, issue_content, issue_status) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.issue_title, req.body.issue_content, `대기`]);
                    yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, CONCAT(?, "/", RI.node_id), CONCAT("새 이슈: @", IFNULL(U.user_name, R.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U JOIN repository_issue AS RI ON R.user_email = U.user_email AND R.node_id = RI.repo_id WHERE R.node_id = ? ORDER BY RI.created_at DESC LIMIT 1`, [0, `/repositories/${req.params.node_id}/issues`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 이슈를 생성했습니다.`, req.params.node_id]);
                    if (insert) {
                        response.status = 200;
                        response.message = `이슈 작성 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssueCreate");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssueCreate = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssueCreate = _classThis;
})();
let RepositoryIssueCommentCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/comment/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCommentCreate = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `이슈 댓글 작성 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const insert = yield mysql.execute(`INSERT INTO repository_issue_comment (issue_id, user_email, comment_content, comment_type, comment_target_id) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.comment_content, req.body.reply ? `reply` : `default`, req.body.reply || null]);
                    yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 댓글: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 이슈에 댓글을 달았습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.node_id]);
                    if (insert) {
                        response.status = 200;
                        response.message = `이슈 댓글 작성 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssueCommentCreate");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssueCommentCreate = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssueCommentCreate = _classThis;
})();
let RepositoryIssueStatus = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/status`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueStatus = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `상태 변경 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const grantes = { data: yield RepositoryGrantes.service({ params: { node_id: req.params.repo_id } }, { send: () => { }, setHeader: () => { } }) };
                    if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email)) {
                        yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, ?, CONCAT("상태 변경: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT("이슈 상태가 \`", RI.issue_status, "\` 에서 \`", ?, "\` (으)로 변경되었습니다.") FROM repositories AS R JOIN users AS R_U JOIN repository_issue AS RI ON R.user_email = R_U.user_email AND RI.repo_id = R.node_id WHERE RI.node_id = ?`, [`/repositories/${req.params.repo_id}/issues/${req.params.node_id}`, req.body.status, req.params.node_id]);
                        const update = yield mysql.execute(`UPDATE repository_issue SET issue_status = ? WHERE node_id = ?`, [req.body.status, req.params.node_id]);
                        if (update) {
                            response.status = 200;
                            response.message = `상태 변경 성공`;
                        }
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssueStatus");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssueStatus = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssueStatus = _classThis;
})();
let RepositoryCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryCreate = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `레포지토리 생성 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`SELECT node_id FROM repositories ORDER BY created_at DESC LIMIT 1`);
                    const data = { node_id: 0 };
                    if (result && Array.isArray(result[0]) && result[0][0]) {
                        const res = result[0][0];
                        data.node_id = res.node_id;
                    }
                    const grantes = JSON.parse(req.body.repo_grantes);
                    if (!grantes.reduce((pre, cur) => [...pre, cur.user_email], []).includes(verify.data.data.user_email))
                        yield mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, `admin`, verify.data.data.user_email]);
                    grantes.forEach((e) => __awaiter(this, void 0, void 0, function* () {
                        yield mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, e.type, e.user_email]);
                        yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]);
                    }));
                    const branch_src = `data/${req.body.user_email}/${data.node_id + 1}/main`;
                    fs_1.default.mkdirSync(branch_src, { recursive: true });
                    const lastId = yield mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                    let id = 1;
                    if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                        id = lastId[0][0].node_id + 1;
                    fs_1.default.mkdirSync(`${branch_src}/${id}`, { recursive: true });
                    fs_1.default.writeFileSync(`${branch_src}/${id}/readme.md`, `## ${req.body.repo_name}`);
                    yield mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [data.node_id + 1, `main`, branch_src.substring(5)]);
                    yield mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [id, `${branch_src}/${id}`, `main branch initial`]);
                    fs_1.default.mkdirSync(`data/${req.body.user_email}/${data.node_id + 1}`, { recursive: true });
                    let path = ``;
                    if (req.file)
                        path = `/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`;
                    const insert = yield mysql.execute(`INSERT INTO repositories (user_email, repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, image_src) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.user_email, req.body.repo_name, req.body.repo_description, req.body.repo_category, req.body.repo_subcategory, req.body.repo_visibility, req.body.repo_archive, req.body.repo_license, path]);
                    grantes.forEach((e) => __awaiter(this, void 0, void 0, function* () { return yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]); }));
                    if (insert) {
                        response.status = 200;
                        response.message = `레포지토리 생성 성공`;
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryCreate");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryCreate = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryCreate = _classThis;
})();
let RepositoryModify = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/modify`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryModify = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `레포지토리 수정 실패` };
                const result = yield mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.body.node_id]);
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const data = result[0][0];
                    const grantes = { data: yield RepositoryGrantes.service({ params: { node_id: req.body.node_id } }, { send: () => { }, setHeader: () => { } }) };
                    if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                        let update;
                        let path = ``;
                        if (req.file)
                            path = `/uploads/${(_a = req.file) === null || _a === void 0 ? void 0 : _a.filename}`;
                        const { repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id } = req.body;
                        if (path === ``)
                            update = yield mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id]);
                        else
                            update = yield mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ?, image_src = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, path, node_id]);
                        yield mysql.execute(`DELETE FROM repository_authorities WHERE repo_id = ?`, [node_id]);
                        JSON.parse(req.body.repo_grantes).forEach((e) => __awaiter(this, void 0, void 0, function* () {
                            yield mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [node_id, e.type, e.user_email]);
                            yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${req.body.node_id}`, req.body.node_id]);
                        }));
                        if (update) {
                            response.status = 200;
                            response.message = `레포지토리 수정 성공`;
                        }
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryModify");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryModify = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryModify = _classThis;
})();
let RepositoryBranchPush = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/push`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchPush = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `커밋 일괄처리 실패` };
                const result = yield mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const data = result[0][0];
                    const grantes = { data: yield RepositoryGrantes.service({ params: { node_id: req.params.node_id } }, { send: () => { }, setHeader: () => { } }) };
                    if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email)) {
                        const result = yield mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);
                        if (result && Array.isArray(result[0])) {
                            if (result[0].length === 0) {
                                const branch_src = `data/${verify.data.data.user_email}/${req.params.node_id}/${req.body.branch}`;
                                fs_1.default.mkdirSync(branch_src, { recursive: true });
                                yield mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [req.params.node_id, req.body.branch, branch_src.substring(5)]);
                            }
                            const reResult = yield mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);
                            if (reResult && Array.isArray(reResult[0]) && reResult[0][0]) {
                                const data = reResult[0][0];
                                const lastId = yield mysql.execute(`SELECT RBC.node_id FROM repository_branch_commit AS RBC JOIN repository_branch AS RB ON RBC.branch_id = RB.node_id WHERE RBC.branch_id = ? AND RB.repo_id = ? ORDER BY RBC.created_at DESC LIMIT 1`, [data.node_id, req.params.node_id]);
                                let id = 1;
                                if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                                    id = lastId[0][0].node_id + 1;
                                else {
                                    const lastId = yield mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                                    if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                                        id = lastId[0][0].node_id + 1;
                                }
                                const path = `data/${data.branch_src}/${id}`;
                                if (id - 1 > 0 && fs_1.default.existsSync(`data/${data.branch_src}/${id - 1}`))
                                    fs_1.default.cpSync(`data/${data.branch_src}/${id - 1}`, path, { recursive: true });
                                else
                                    fs_1.default.mkdirSync(path, { recursive: true });
                                req.body.commits.forEach((e) => {
                                    const paths = e.name.split(`/`);
                                    if (paths.length > 1) {
                                        paths.forEach((e_, idx) => {
                                            if (idx + 1 !== paths.length)
                                                fs_1.default.mkdirSync(`${path}/${e_}`, { recursive: true });
                                        });
                                    }
                                    if (fs_1.default.existsSync(`${path}/${e.name}`))
                                        fs_1.default.unlinkSync(`${path}/${e.name}`);
                                    if (e.file)
                                        fs_1.default.writeFileSync(`${path}/${e.name}`, e.file);
                                    else
                                        fs_1.default.writeFileSync(`${path}/${e.name}`, ``);
                                });
                                const insert = yield mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [data.node_id, `${path}`, req.body.commits[req.body.commits.length - 1].message]);
                                yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RA.target_email, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), CONCAT("\`", ?, "\` 브랜치에 커밋 일괄처리가 되었습니다.") FROM repositories AS R JOIN users U JOIN repository_authorities AS RA ON R.user_email = U.user_email AND RA.repo_id = R.node_id WHERE R.node_id = ?`, [`/repositories/${req.params.node_id}`, req.body.branch, req.params.node_id]);
                                if (insert) {
                                    response.status = 200;
                                    response.message = `커밋 일괄처리 성공`;
                                }
                            }
                        }
                    }
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryBranchPush");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryBranchPush = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryBranchPush = _classThis;
})();
let RepositoryStars = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/stars`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryStars = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `스타 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ?`, [req.params.node_id]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `스타 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryStars");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryStars = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryStars = _classThis;
})();
let RepositoryStar = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/star`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryStar = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `스타 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                    if (result && Array.isArray(result[0])) {
                        if (result[0][0])
                            yield mysql.execute(`DELETE FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                        else {
                            yield mysql.execute(`INSERT INTO repository_star (repo_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                            yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [0, `/repositories/${req.params.node_id}`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 스타를 남겼습니다.`, req.params.node_id]);
                        }
                    }
                    response.status = 200;
                    response.message = `스타 성공`;
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryStar");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryStar = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryStar = _classThis;
})();
let RepositoryIssueCommentHeart = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:issue_id/comment/:node_id/heart`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCommentHeart = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `하트 실패` };
                const verify = { data: yield OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
                if (verify.data.status === 200) {
                    const result = yield mysql.execute(`SELECT * FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                    if (result && Array.isArray(result[0])) {
                        if (result[0][0])
                            yield mysql.execute(`DELETE FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                        else {
                            yield mysql.execute(`INSERT INTO repository_issue_comment_heart (comment_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                            yield mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RIC.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 하트: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 댓글에 하트를 남겼습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? AND RIC.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.issue_id, req.params.node_id]);
                        }
                    }
                    response.status = 200;
                    response.message = `하트 성공`;
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "RepositoryIssueCommentHeart");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RepositoryIssueCommentHeart = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RepositoryIssueCommentHeart = _classThis;
})();
let Topics = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/topics/:category`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Topics = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `토픽 목록 불러오기 실패` };
                let result;
                if (req.params.category === `all`)
                    result = yield mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC LIMIT 100`);
                else
                    result = yield mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 AND repo_category = ? ORDER BY R.created_at DESC LIMIT 100`, [req.params.category]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `토픽 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "Topics");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Topics = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Topics = _classThis;
})();
let Categories = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/categories`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Categories = _classThis = class {
        static service(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.setHeader(`Content-type`, `application/json`);
                const response = { status: 400, message: `카테고리 목록 불러오기 실패` };
                const result = yield mysql.execute(`SELECT DISTINCT repo_category FROM repositories ORDER BY created_at DESC LIMIT 100`);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `카테고리 목록 불러오기 성공`;
                    response.data = result[0];
                }
                res.send(JSON.stringify(response));
            });
        }
    };
    __setFunctionName(_classThis, "Categories");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Categories = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Categories = _classThis;
})();
Control.setRoutes();
Control.spawnListen();
