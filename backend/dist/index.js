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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Search = exports.Categories = exports.Topics = exports.RepositoryIssueCommentHeart = exports.RepositoryStar = exports.RepositoryStars = exports.RepositoryIssueCommentRemove = exports.RepositoryIssueRemove = exports.RepositoryRemove = exports.RepositoryBranchRemove = exports.RepositoryPullRequestCreate = exports.RepositoryPullRequest = exports.RepositoryPullRequests = exports.RepositoryBranchPush = exports.RepositoryFork = exports.RepositoryModify = exports.RepositoryCreate = exports.RepositoryIssueStatus = exports.RepositoryIssueCommentCreate = exports.RepositoryIssueCreate = exports.RepositoryIssueComments = exports.RepositoryIssue = exports.RepositoryIssues = exports.RepositoryBranchPrevCommitDirectory = exports.RepositoryBranchCommitDirectory = exports.RepositoryBranchCommit = exports.RepositoryBranchCommits = exports.RepositoryBranchDirectory = exports.RepositoryBranch = exports.RepositoryBranches = exports.RepositoryGrantes = exports.Repository = exports.Repositories = exports.UserFollower = exports.UserFollowing = exports.UserFollow = exports.UserModifyPassword = exports.UserModifyBio = exports.UserModifyName = exports.UserModifyAvatar = exports.UserAlert = exports.UserAlerts = exports.UserDeviceRemove = exports.UserDevices = exports.UserViewPrivate = exports.User = exports.OauthVerify = exports.OauthSignUp = exports.OauthSignIn = exports.OauthOTP = void 0;
const node_cloudflare_r2_1 = require("node-cloudflare-r2");
const nodemailer_1 = __importDefault(require("nodemailer"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const openai_1 = require("openai");
const crypto_1 = __importDefault(require("crypto"));
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
const client = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.ORGANIZATION_ID
});
const r2 = new node_cloudflare_r2_1.R2({
    accountId: process.env.ACCOUNT_ID || ``,
    accessKeyId: process.env.ACCESS_KEY_ID || ``,
    secretAccessKey: process.env.SECRET_ACCESS_KEY || ``
});
const bucket = r2.bucket(`object-storage`);
bucket.provideBucketPublicUrl(process.env.PUBLIC_URL || ``);
const recursion = async (path) => {
    const items = (await bucket.listObjects()).objects;
    const buildStructure = async (pre, cur) => {
        const splits = cur.key.split(`/`).slice(5);
        let current = await pre;
        for (let idx = 0; idx < splits.length; idx++) {
            const part = splits[idx];
            const existing = current.find((item) => item.name === part);
            if (idx === splits.length - 1) {
                const content = bucket.getObjectPublicUrls(cur.key)[0];
                const response = await (await fetch(content)).text();
                if (!existing)
                    current.push({ path: cur.key, name: part, type: `file`, public: content, content: response });
            }
            else {
                if (!existing) {
                    const newFolder = { path: cur.key, name: part, type: `folder`, public: ``, content: [] };
                    current.push(newFolder);
                    current = newFolder.content;
                }
                else
                    current = existing.content;
            }
        }
        return pre;
    };
    const filter = items.filter(e => `${e.key}`.startsWith(path));
    return await filter.reduce(buildStructure, Promise.resolve([]));
};
const getVerify = async (req) => {
    return { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
};
const getGrantes = async (req) => {
    return { data: await RepositoryGrantes.service({ params: { node_id: req.params.repo_id } }, { send: () => { }, setHeader: () => { } }) };
};
let OauthOTP = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/otp`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthOTP = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OauthOTP = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `로그인 실패` };
            const result = await mysql.execute(`SELECT * FROM otps WHERE user_email = ? AND code = ?`, [req.body.user_email, req.body.code]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                await mysql.execute(`DELETE FROM otps WHERE node_id = ?`, [data.node_id]);
                const device = await mysql.execute(`SELECT * FROM user_device WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
                if (device && Array.isArray(device[0]) && device[0][0])
                    await mysql.execute(`UPDATE user_device SET updated_at = NOW() WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
                else
                    await mysql.execute(`INSERT INTO user_device (user_email, device_agent) VALUES (?, ?)`, [req.body.user_email, req.headers[`user-agent`]]);
                response.status = 200;
                response.message = `로그인 성공`;
                response.data = { accessToken: (0, jwt_1.accessToken)(data.user_email) };
            }
            res.send(JSON.stringify(response));
        }
    };
    return OauthOTP = _classThis;
})();
exports.OauthOTP = OauthOTP;
let OauthSignIn = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/signin`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthSignIn = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OauthSignIn = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `인증메일 전송 실패` };
            if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
                const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ? AND user_password = ?`, [req.body.user_email, crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const data = result[0][0];
                    const code = otp_generator_1.default.generate(4, { upperCaseAlphabets: false, specialChars: false });
                    await mysql.execute(`INSERT INTO otps (user_email, code) VALUES (?, ?)`, [data.user_email, code]);
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
        }
    };
    return OauthSignIn = _classThis;
})();
exports.OauthSignIn = OauthSignIn;
let OauthSignUp = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/signup`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthSignUp = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OauthSignUp = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `회원가입 실패` };
            if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
                const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.body.user_email]);
                if (result && Array.isArray(result[0]) && !result[0][0]) {
                    const insert = await mysql.execute(`INSERT INTO users (user_email, user_password) VALUES (?, ?)`, [req.body.user_email, crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
                    if (insert) {
                        response.status = 200;
                        response.message = `회원가입 성공, 로그인 필요`;
                    }
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return OauthSignUp = _classThis;
})();
exports.OauthSignUp = OauthSignUp;
let OauthVerify = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/v1/user/verify`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var OauthVerify = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            OauthVerify = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = (0, jwt_1.verify)(req.body.accessToken);
            response.status = 400;
            response.message = `로그인 정보 확인 실패`;
            if (response.data?.user_email) {
                let result;
                if (!req.body.agent)
                    result = await mysql.execute(`SELECT U.* FROM users AS U JOIN user_device AS UD ON U.user_email = UD.user_email WHERE U.user_email = ? AND UD.device_agent = ?`, [response.data.user_email, req.headers[`user-agent`]]);
                else
                    result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [response.data.user_email]);
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
        }
    };
    return OauthVerify = _classThis;
})();
exports.OauthVerify = OauthVerify;
let User = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/user/:user_email`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var User = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            User = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `유저 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.params.user_email]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `유저 불러오기 성공`;
                response.data = result[0][0];
                response.data.user_password = `(secure)`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return User = _classThis;
})();
exports.User = User;
let UserViewPrivate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/view-private`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserViewPrivate = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserViewPrivate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 목록 불러오기 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                const result = await mysql.execute(`SELECT U.user_name, R.* FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.user_email = ? ORDER BY R.created_at DESC`, [req.body.user_email]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `레포지토리 목록 불러오기 성공`;
                    response.data = result[0];
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserViewPrivate = _classThis;
})();
exports.UserViewPrivate = UserViewPrivate;
let UserDevices = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/devices`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserDevices = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserDevices = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `디바이스 목록 불러오기 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`SELECT * FROM user_device WHERE user_email = ?`, [verify.data.data.user_email]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `디바이스 목록 불러오기 성공`;
                    response.data = result[0];
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserDevices = _classThis;
})();
exports.UserDevices = UserDevices;
let UserDeviceRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/device/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserDeviceRemove = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserDeviceRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `디바이스 제거 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`DELETE FROM user_device WHERE user_email = ? AND device_agent = ?`, [verify.data.data.user_email, req.body.agent]);
                if (result) {
                    response.status = 200;
                    response.message = `디바이스 제거 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserDeviceRemove = _classThis;
})();
exports.UserDeviceRemove = UserDeviceRemove;
let UserAlerts = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/alerts`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserAlerts = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserAlerts = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `알림 목록 불러오기 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                let result;
                if (req.body?.limit)
                    result = await mysql.execute(`SELECT * FROM user_alert WHERE user_email = ? ORDER BY created_at DESC LIMIT 5`, [verify.data.data.user_email]);
                else
                    result = await mysql.execute(`SELECT * FROM user_alert WHERE user_email = ? ORDER BY created_at DESC`, [verify.data.data.user_email]);
                if (result && Array.isArray(result[0])) {
                    response.status = 200;
                    response.message = `알림 목록 불러오기 성공`;
                    response.data = result[0];
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserAlerts = _classThis;
})();
exports.UserAlerts = UserAlerts;
let UserAlert = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/alert`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserAlert = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserAlert = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `알림 읽기 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                req.body.ids.forEach(async (id) => await mysql.execute(`UPDATE user_alert SET alert_read = 1 WHERE node_id = ? AND user_email = ?`, [id, verify.data.data.user_email]));
                response.status = 200;
                response.message = `알림 읽기 성공`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserAlert = _classThis;
})();
exports.UserAlert = UserAlert;
let UserModifyAvatar = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/avatar`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyAvatar = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserModifyAvatar = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `아바타 수정 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email && req.file) {
                let update;
                if (name)
                    update = await mysql.execute(`UPDATE users SET avatar_src = ? WHERE user_email = ?`, [`${process.env.PUBLIC_URL}/${name.key}`, req.body.user_email]);
                if (update) {
                    response.status = 200;
                    response.message = `아바타 수정 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserModifyAvatar = _classThis;
})();
exports.UserModifyAvatar = UserModifyAvatar;
let UserModifyName = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/name`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyName = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserModifyName = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이름 수정 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                const update = await mysql.execute(`UPDATE users SET user_name = ? WHERE user_email = ?`, [req.body.user_name, req.body.user_email]);
                if (update) {
                    response.status = 200;
                    response.message = `이름 수정 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserModifyName = _classThis;
})();
exports.UserModifyName = UserModifyName;
let UserModifyBio = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/bio`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyBio = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserModifyBio = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `설명 수정 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                const update = await mysql.execute(`UPDATE users SET user_bio = ? WHERE user_email = ?`, [req.body.user_bio, req.body.user_email]);
                if (update) {
                    response.status = 200;
                    response.message = `설명 수정 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserModifyBio = _classThis;
})();
exports.UserModifyBio = UserModifyBio;
let UserModifyPassword = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/modify/password`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserModifyPassword = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserModifyPassword = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `비밀번호 수정 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
                const update = await mysql.execute(`UPDATE users SET user_password = ? WHERE user_email = ?`, [crypto_1.default.createHash(`sha512`).update(req.body.user_password).digest(`hex`), req.body.user_email]);
                if (update) {
                    response.status = 200;
                    response.message = `비밀번호 수정 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserModifyPassword = _classThis;
})();
exports.UserModifyPassword = UserModifyPassword;
let UserFollow = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/user/follow`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserFollow = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserFollow = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `팔로우 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200 && verify.data.data.user_email !== req.body.user_email) {
                const result = await mysql.execute(`SELECT * FROM user_follow WHERE user_email = ? AND target_email = ?`, [verify.data.data.user_email, req.body.user_email]);
                if (result && Array.isArray(result[0]) && result[0][0])
                    await mysql.execute(`DELETE FROM user_follow WHERE user_email = ? AND target_email = ?`, [verify.data.data.user_email, req.body.user_email]);
                else {
                    await mysql.execute(`INSERT INTO user_follow (user_email, target_email) VALUES (?, ?)`, [verify.data.data.user_email, req.body.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, CONCAT("/", U.user_email), CONCAT("새 팔로워: @", IFNULL(U.user_name, U.user_email)), CONCAT(IFNULL(U.user_name, U.user_email), "님이 당신을 팔로우하기 시작했습니다.") FROM users AS U WHERE U.user_email = ?`, [req.body.user_email, verify.data.data.user_email]);
                }
                response.status = 200;
                response.message = `팔로우 성공`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserFollow = _classThis;
})();
exports.UserFollow = UserFollow;
let UserFollowing = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/:user_email/following`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserFollowing = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserFollowing = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `팔로잉 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT U.user_email, U.user_name, U.avatar_src, U.user_bio, UF.created_at FROM user_follow AS UF JOIN users AS U ON UF.target_email = U.user_email WHERE UF.user_email = ?`, [req.params.user_email]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `팔로잉 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserFollowing = _classThis;
})();
exports.UserFollowing = UserFollowing;
let UserFollower = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/:user_email/follower`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var UserFollower = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            UserFollower = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `팔로워 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT U.user_email, U.user_name, U.avatar_src, U.user_bio, UF.created_at FROM user_follow AS UF JOIN users AS U ON UF.user_email = U.user_email WHERE UF.target_email = ?`, [req.params.user_email]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `팔로워 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return UserFollower = _classThis;
})();
exports.UserFollower = UserFollower;
let Repositories = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/:user_email/repositories`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Repositories = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Repositories = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.user_email = ? AND repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC`, [req.params.user_email]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `레포지토리 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return Repositories = _classThis;
})();
exports.Repositories = Repositories;
let Repository = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Repository = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Repository = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 불러오기 실패` };
            const result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
            const grantes = await mysql.execute(`SELECT RA.* FROM repository_authorities AS RA JOIN repositories AS R ON RA.repo_id = R.node_id WHERE RA.repo_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0] && grantes && Array.isArray(grantes[0])) {
                response.status = 200;
                response.message = `레포지토리 불러오기 성공`;
                response.data = result[0][0];
                response.data.repo_grantes = grantes[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return Repository = _classThis;
})();
exports.Repository = Repository;
let RepositoryGrantes = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/grantes`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryGrantes = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryGrantes = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `권한 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_authorities WHERE repo_id = ?`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `권한 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
            return response;
        }
    };
    return RepositoryGrantes = _classThis;
})();
exports.RepositoryGrantes = RepositoryGrantes;
let RepositoryBranches = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/branches`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranches = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranches = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `브랜치 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `브랜치 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranches = _classThis;
})();
exports.RepositoryBranches = RepositoryBranches;
let RepositoryBranch = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranch = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranch = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `브랜치 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `브랜치 불러오기 성공`;
                response.data = result[0][0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranch = _classThis;
})();
exports.RepositoryBranch = RepositoryBranch;
let RepositoryBranchDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/directory`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchDirectory = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchDirectory = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `디렉터리 불러오기 실패` };
            const result = await mysql.execute(`SELECT RB.*, U.user_email FROM repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.repo_id = ? AND RB.node_id = ?`, [req.params.repo_id, req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                response.status = 200;
                response.message = `디렉터리 불러오기 성공`;
                response.data = [];
                const lastCommit = await mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.node_id = ? ORDER BY RB.created_at DESC LIMIT 1`, [data.node_id]);
                if (lastCommit && Array.isArray(lastCommit[0]) && lastCommit[0][0]) {
                    const commit = lastCommit[0][0];
                    response.data = await recursion(`${commit.commit_src}`);
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
        }
    };
    return RepositoryBranchDirectory = _classThis;
})();
exports.RepositoryBranchDirectory = RepositoryBranchDirectory;
let RepositoryBranchCommits = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/commits`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommits = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchCommits = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `커밋 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id WHERE RB.node_id = ? AND R.node_id = ? ORDER BY RBC.created_at DESC`, [req.params.node_id, req.params.repo_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `커밋 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranchCommits = _classThis;
})();
exports.RepositoryBranchCommits = RepositoryBranchCommits;
let RepositoryBranchCommit = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommit = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchCommit = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `커밋 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `커밋 불러오기 성공`;
                response.data = result[0][0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranchCommit = _classThis;
})();
exports.RepositoryBranchCommit = RepositoryBranchCommit;
let RepositoryBranchCommitDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchCommitDirectory = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchCommitDirectory = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `디렉터리 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const commit = result[0][0];
                response.status = 200;
                response.message = `디렉터리 불러오기 성공`;
                response.data = await recursion(`${commit.commit_src}`);
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
        }
    };
    return RepositoryBranchCommitDirectory = _classThis;
})();
exports.RepositoryBranchCommitDirectory = RepositoryBranchCommitDirectory;
let RepositoryBranchPrevCommitDirectory = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory/prev`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchPrevCommitDirectory = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchPrevCommitDirectory = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `디렉터리 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE branch_id = ? AND node_id < ? ORDER BY created_at DESC LIMIT 1`, [req.params.branch_id, Number(req.params.node_id)]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const commit = result[0][0];
                response.status = 200;
                response.message = `디렉터리 불러오기 성공`;
                response.data = await recursion(`${commit.commit_src}`);
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
        }
    };
    return RepositoryBranchPrevCommitDirectory = _classThis;
})();
exports.RepositoryBranchPrevCommitDirectory = RepositoryBranchPrevCommitDirectory;
let RepositoryIssues = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/issues`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssues = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssues = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `이슈 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssues = _classThis;
})();
exports.RepositoryIssues = RepositoryIssues;
let RepositoryIssue = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssue = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssue = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? AND node_id = ?`, [req.params.repo_id, req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `이슈 불러오기 성공`;
                response.data = result[0][0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssue = _classThis;
})();
exports.RepositoryIssue = RepositoryIssue;
let RepositoryIssueComments = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id/comments`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueComments = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueComments = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 댓글 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT U.user_email, U.avatar_src, U.user_name, RIC.*, (SELECT user_email FROM repository_issue_comment AS RIC2 WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_email, (SELECT U.user_name FROM repository_issue_comment AS RIC2 JOIN users AS U ON U.user_email = RIC2.user_email WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_name FROM repository_issue_comment AS RIC JOIN users AS U ON RIC.user_email = U.user_email WHERE RIC.issue_id = ? ORDER BY RIC.created_at ASC`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `이슈 댓글 목록 불러오기 성공`;
                response.data = [];
                const hearts = await mysql.execute(`SELECT RICH.*, RIC.issue_id FROM repository_issue_comment_heart AS RICH JOIN repository_issue_comment AS RIC ON RICH.comment_id = RIC.node_id WHERE RIC.issue_id = ?`, [req.params.node_id]);
                result[0].forEach(async (e) => {
                    if (hearts && Array.isArray(hearts[0]) && hearts[0].find((i) => i.comment_id === e.node_id))
                        response.data.push({ ...e, hearts: hearts[0].filter((i) => i.comment_id === e.node_id) });
                    else
                        response.data.push({ ...e, hearts: [] });
                });
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueComments = _classThis;
})();
exports.RepositoryIssueComments = RepositoryIssueComments;
let RepositoryIssueCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/issue/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCreate = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueCreate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 작성 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const insert = await mysql.execute(`INSERT INTO repository_issue (repo_id, user_email, issue_title, issue_content, issue_status) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.issue_title, req.body.issue_content, `대기`]);
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, CONCAT(?, "/", RI.node_id), CONCAT("새 이슈: @", IFNULL(U.user_name, R.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U JOIN repository_issue AS RI ON R.user_email = U.user_email AND R.node_id = RI.repo_id WHERE R.node_id = ? ORDER BY RI.created_at DESC LIMIT 1`, [0, `/repositories/${req.params.node_id}/issues`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 이슈를 생성했습니다.`, req.params.node_id]);
                if (insert) {
                    response.status = 200;
                    response.message = `이슈 작성 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueCreate = _classThis;
})();
exports.RepositoryIssueCreate = RepositoryIssueCreate;
let RepositoryIssueCommentCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/comment/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCommentCreate = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueCommentCreate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 댓글 작성 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const insert = await mysql.execute(`INSERT INTO repository_issue_comment (issue_id, user_email, comment_content, comment_type, comment_target_id) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.comment_content, req.body.reply ? `reply` : `default`, req.body.reply || null]);
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 댓글: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 이슈에 댓글을 달았습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.node_id]);
                if (insert) {
                    response.status = 200;
                    response.message = `이슈 댓글 작성 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueCommentCreate = _classThis;
})();
exports.RepositoryIssueCommentCreate = RepositoryIssueCommentCreate;
let RepositoryIssueStatus = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/status`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueStatus = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueStatus = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `상태 변경 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const grantes = getGrantes(req);
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email)) {
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, ?, CONCAT("상태 변경: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT("이슈 상태가 \`", RI.issue_status, "\` 에서 \`", ?, "\` (으)로 변경되었습니다.") FROM repositories AS R JOIN users AS R_U JOIN repository_issue AS RI ON R.user_email = R_U.user_email AND RI.repo_id = R.node_id WHERE RI.node_id = ?`, [`/repositories/${req.params.repo_id}/issues/${req.params.node_id}`, req.body.status, req.params.node_id]);
                    const update = await mysql.execute(`UPDATE repository_issue SET issue_status = ? WHERE node_id = ?`, [req.body.status, req.params.node_id]);
                    if (update) {
                        response.status = 200;
                        response.message = `상태 변경 성공`;
                    }
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueStatus = _classThis;
})();
exports.RepositoryIssueStatus = RepositoryIssueStatus;
let RepositoryCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryCreate = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryCreate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 생성 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`SELECT node_id FROM repositories ORDER BY created_at DESC LIMIT 1`);
                const data = { node_id: 0 };
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const res = result[0][0];
                    data.node_id = res.node_id;
                }
                const grantes = JSON.parse(req.body.repo_grantes);
                if (!grantes.reduce((pre, cur) => [...pre, cur.user_email], []).includes(verify.data.data.user_email))
                    await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, `admin`, verify.data.data.user_email]);
                grantes.forEach(async (e) => {
                    await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, e.type, e.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("새 권한: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]);
                });
                const branch_src = `data/${req.body.user_email}/${data.node_id + 1}/main`;
                const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                let id = 1;
                if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                    id = lastId[0][0].node_id + 1;
                await bucket.upload(`## ${req.body.repo_name}`, `${branch_src}/${id}/readme.md`);
                const branch = await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [data.node_id + 1, `main`, branch_src]);
                await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [branch[0].insertId, `${branch_src}/${id}`, `main branch initial`]);
                let path = ``;
                if (name)
                    path = `${process.env.PUBLIC_URL}/${name.key}`;
                const insert = await mysql.execute(`INSERT INTO repositories (node_id, user_email, repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, image_src) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [data.node_id + 1, req.body.user_email, req.body.repo_name, req.body.description, req.body.repo_category, req.body.repo_subcategory, req.body.repo_visibility, req.body.repo_archive, req.body.repo_license, path]);
                grantes.forEach(async (e) => await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]));
                if (insert) {
                    response.status = 200;
                    response.message = `레포지토리 생성 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryCreate = _classThis;
})();
exports.RepositoryCreate = RepositoryCreate;
let RepositoryModify = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/modify`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryModify = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryModify = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 수정 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.body.node_id]);
            const verify = await getVerify(req);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                const grantes = { data: await RepositoryGrantes.service({ params: { node_id: req.body.node_id } }, { send: () => { }, setHeader: () => { } }) };
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                    let update;
                    let path = ``;
                    if (name)
                        path = `${process.env.PUBLIC_URL}/${name.key}`;
                    const { repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id } = req.body;
                    if (path === ``)
                        update = await mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id]);
                    else
                        update = await mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ?, image_src = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, path, node_id]);
                    await mysql.execute(`DELETE FROM repository_authorities WHERE repo_id = ?`, [node_id]);
                    JSON.parse(req.body.repo_grantes).forEach(async (e) => {
                        await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [node_id, e.type, e.user_email]);
                        await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${req.body.node_id}`, req.body.node_id]);
                    });
                    if (update) {
                        response.status = 200;
                        response.message = `레포지토리 수정 성공`;
                    }
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryModify = _classThis;
})();
exports.RepositoryModify = RepositoryModify;
let RepositoryFork = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/fork`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryFork = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryFork = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 포크 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`SELECT node_id FROM repositories ORDER BY created_at DESC LIMIT 1`);
                const data = { node_id: 0 };
                if (result && Array.isArray(result[0]) && result[0][0]) {
                    const res = result[0][0];
                    data.node_id = res.node_id;
                }
                const grantes = JSON.parse(req.body.repo_grantes);
                if (!grantes.reduce((pre, cur) => [...pre, cur.user_email], []).includes(verify.data.data.user_email))
                    await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, `admin`, verify.data.data.user_email]);
                grantes.forEach(async (e) => {
                    await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, e.type, e.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("새 권한: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]);
                });
                const branch_src = `data/${req.body.user_email}/${data.node_id + 1}/main`;
                const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                let id = 1;
                if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                    id = lastId[0][0].node_id + 1;
                await bucket.upload(`## ${req.body.repo_name}`, `${branch_src}/${id}/readme.md`);
                const branch = await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [data.node_id + 1, `main`, branch_src]);
                await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [branch[0].insertId, `${branch_src}/${id}`, `main branch initial`]);
                let path = ``;
                if (name)
                    path = `${process.env.PUBLIC_URL}/${name.key}`;
                const insert = await mysql.execute(`INSERT INTO repositories (node_id, repo_type, user_email, repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, image_src) VALUES (?, "forked", ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [data.node_id + 1, req.body.user_email, req.body.repo_name, req.body.repo_description, req.body.repo_category, req.body.repo_subcategory, req.body.repo_visibility, req.body.repo_archive, req.body.repo_license, path]);
                grantes.forEach(async (e) => await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]));
                if (insert) {
                    response.status = 200;
                    response.message = `레포지토리 포크 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryFork = _classThis;
})();
exports.RepositoryFork = RepositoryFork;
let RepositoryBranchPush = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/push`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchPush = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchPush = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `커밋 일괄처리 실패` };
            const repositoryResult = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (repositoryResult && Array.isArray(repositoryResult[0]) && repositoryResult[0][0]) {
                const data = repositoryResult[0][0];
                const grantes = { data: await RepositoryGrantes.service({ params: { node_id: req.params.node_id } }, { send: () => { }, setHeader: () => { } }) };
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email)) {
                    const result = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);
                    if (result && Array.isArray(result[0])) {
                        if (result[0].length === 0) {
                            const branch_src = `data/${verify.data.data.user_email}/${req.params.node_id}/${req.body.branch}`;
                            await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [req.params.node_id, req.body.branch, branch_src]);
                        }
                        const reResult = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);
                        if (reResult && Array.isArray(reResult[0]) && reResult[0][0]) {
                            const data = reResult[0][0];
                            const lastId = await mysql.execute(`SELECT RBC.node_id FROM repository_branch_commit AS RBC JOIN repository_branch AS RB ON RBC.branch_id = RB.node_id WHERE RBC.branch_id = ? AND RB.repo_id = ? ORDER BY RBC.created_at DESC LIMIT 1`, [data.node_id, req.params.node_id]);
                            let id = 1;
                            if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                                id = lastId[0][0].node_id + 1;
                            else {
                                const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                                if (lastId && Array.isArray(lastId[0]) && lastId[0][0])
                                    id = lastId[0][0].node_id + 1;
                            }
                            const recursionSecond = async (path) => {
                                const recursionResult = await recursion(path);
                                if (id - 1 > 0 && recursionResult.length > 0) {
                                    for (let i = 0; i < recursionResult.length; i++) {
                                        if (recursionResult[i].type === `file`) {
                                            const response = await (await fetch(recursionResult[i].public)).text();
                                            await bucket.uploadStream(response, `${data.branch_src}/${id}/${recursionResult[i].name}`);
                                        }
                                        else {
                                            console.log(`${data.branch_src}/${id}/${recursionResult[i].name}`);
                                            await recursionSecond(`${data.branch_src}/${id}/${recursionResult[i].name}`);
                                        }
                                    }
                                }
                            };
                            const path = `${data.branch_src}/${id - 1}`;
                            await recursionSecond(path);
                            const newPath = `${data.branch_src}/${id}`;
                            req.body.commits.forEach(async (e) => {
                                if (e.type === `add`) {
                                    if (await bucket.objectExists(`${newPath}/${e.name}`)) {
                                        await bucket.deleteObject(`${newPath}/${e.name}`);
                                    }
                                    if (e.file)
                                        await bucket.upload(e.file, `${newPath}/${e.name}`);
                                    else
                                        await bucket.upload(``, `${newPath}/${e.name}`);
                                }
                                else if (e.type === `remove`) {
                                    if (await bucket.objectExists(`${newPath}/${e.name}`))
                                        await bucket.deleteObject(`${newPath}/${e.name}`);
                                }
                            });
                            const insert = await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [data.node_id, newPath, req.body.message || `메시지 없음`]);
                            await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RA.target_email, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), CONCAT("\`", ?, "\` 브랜치에 커밋 일괄처리가 되었습니다.") FROM repositories AS R JOIN users U JOIN repository_authorities AS RA ON R.user_email = U.user_email AND RA.repo_id = R.node_id WHERE R.node_id = ?`, [`/repositories/${req.params.node_id}`, req.body.branch, req.params.node_id]);
                            let description = repositoryResult[0][0].repo_description?.trim() || ``;
                            if (!description) {
                                const chat = await client.chat.completions.create({
                                    model: `gpt-4o-mini`,
                                    temperature: .7,
                                    max_tokens: 48,
                                    top_p: 1,
                                    messages: [
                                        { role: `system`, content: `코드를 훑어보고 어떤 목적으로 작성한건지 단 한줄 이내의 완벽히 간략한 설명을 작성해야해.\n모든 불필요한 말과 마침표를 제외해줘.\n예시) 제 2의 클라우드 컴퓨팅 겸 레포지토리 호스팅 서비스` },
                                        { role: `user`, content: req.body.commits.reduce((pre, cur) => [...pre, `\`\`\`\n${cur.file}\n\`\`\``], []).join(`\n\n`) },
                                    ],
                                });
                                description = chat.choices[0].message.content;
                            }
                            await mysql.execute(`UPDATE repositories SET repo_description = ? WHERE node_id = ?`, [description, req.params.node_id]);
                            if (insert) {
                                response.status = 200;
                                response.message = `커밋 일괄처리 성공`;
                            }
                        }
                    }
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranchPush = _classThis;
})();
exports.RepositoryBranchPush = RepositoryBranchPush;
let RepositoryPullRequests = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/pullrequests`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryPullRequests = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryPullRequests = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `풀리퀘스트 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_pullrequest WHERE target_repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `풀리퀘스트 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryPullRequests = _classThis;
})();
exports.RepositoryPullRequests = RepositoryPullRequests;
let RepositoryPullRequest = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:repo_id/pullrequest/:node_id`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryPullRequest = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryPullRequest = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `풀리퀘스트 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_pullrequest WHERE node_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
            if (result && Array.isArray(result[0]) && result[0][0]) {
                response.status = 200;
                response.message = `풀리퀘스트 불러오기 성공`;
                response.data = result[0][0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryPullRequest = _classThis;
})();
exports.RepositoryPullRequest = RepositoryPullRequest;
let RepositoryPullRequestCreate = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/pullrequest/create`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryPullRequestCreate = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryPullRequestCreate = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `풀리퀘스트 전송 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (result && Array.isArray(result[0]) && result[0][0] && verify.data.status === 200) {
                await mysql.execute(`INSERT INTO repository_pullrequest (repo_id, target_repo_id, user_email, pr_type, branch_name, target_branch_name, commit_id, pr_title, pr_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.repo_id, req.body.target_repo_id, verify.data.data.user_email, `대기`, req.body.branch_name, req.body.target_branch_name, req.body.commit_id, req.body.pr_title, req.body.pr_content]);
                response.status = 200;
                response.message = `풀리퀘스트 전송 성공`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryPullRequestCreate = _classThis;
})();
exports.RepositoryPullRequestCreate = RepositoryPullRequestCreate;
let RepositoryBranchRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/branch/:node_id/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryBranchRemove = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryBranchRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `브랜치 삭제 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
            const branch = await mysql.execute(`SELECT * FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (result && Array.isArray(result[0]) && result[0][0] && branch && Array.isArray(branch[0]) && branch[0][0]) {
                const data = result[0][0];
                const grantes = getGrantes(req);
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                    await mysql.execute(`DELETE FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
                    await mysql.execute(`DELETE FROM repository_branch_commit WHERE branch_id = ?`, [req.params.node_id]);
                    await bucket.deleteObject(`/data/${data.user_email}/${req.params.repo_id}/${branch[0][0].branch_name}`);
                    response.status = 200;
                    response.message = `브랜치 삭제 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryBranchRemove = _classThis;
})();
exports.RepositoryBranchRemove = RepositoryBranchRemove;
let RepositoryRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryRemove = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `레포지토리 삭제 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                const grantes = { data: await RepositoryGrantes.service({ params: { node_id: req.params.node_id } }, { send: () => { }, setHeader: () => { } }) };
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                    await mysql.execute(`DELETE FROM repositories WHERE node_id = ?`, [req.params.node_id]);
                    await mysql.execute(`DELETE FROM repository_branch WHERE repo_id = ?`, [req.params.node_id]);
                    await mysql.execute(`DELETE FROM repository_authorities WHERE repo_id = ?`, [req.params.node_id]);
                    await bucket.deleteObject(`/data/${data.user_email}/${req.params.node_id}`);
                    response.status = 200;
                    response.message = `레포지토리 삭제 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryRemove = _classThis;
})();
exports.RepositoryRemove = RepositoryRemove;
let RepositoryIssueRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueRemove = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `이슈 삭제 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                const grantes = getGrantes(req);
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                    await mysql.execute(`DELETE FROM repository_issue WHERE node_id = ?`, [req.params.node_id]);
                    response.status = 200;
                    response.message = `이슈 삭제 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueRemove = _classThis;
})();
exports.RepositoryIssueRemove = RepositoryIssueRemove;
let RepositoryIssueCommentRemove = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:issue_id/comments/:node_id/remove`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCommentRemove = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueCommentRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `댓글 삭제 실패` };
            const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
            const verify = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } }, { send: () => { }, setHeader: () => { } }) };
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0];
                const grantes = getGrantes(req);
                if (grantes.data.data.find((e) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                    await mysql.execute(`DELETE FROM repository_issue_comment WHERE node_id = ?`, [req.params.node_id]);
                    await mysql.execute(`DELETE FROM repository_issue_comment_heart WHERE comment_id = ?`, [req.params.node_id]);
                    response.status = 200;
                    response.message = `댓글 삭제 성공`;
                }
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueCommentRemove = _classThis;
})();
exports.RepositoryIssueCommentRemove = RepositoryIssueCommentRemove;
let RepositoryStars = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/repository/:node_id/stars`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryStars = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryStars = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `스타 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ?`, [req.params.node_id]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `스타 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryStars = _classThis;
})();
exports.RepositoryStars = RepositoryStars;
let RepositoryStar = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:node_id/star`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryStar = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryStar = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `스타 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                if (result && Array.isArray(result[0])) {
                    if (result[0][0])
                        await mysql.execute(`DELETE FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                    else {
                        await mysql.execute(`INSERT INTO repository_star (repo_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                        await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, ?, CONCAT("새 스타: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [0, `/repositories/${req.params.node_id}`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 스타를 남겼습니다.`, req.params.node_id]);
                    }
                }
                response.status = 200;
                response.message = `스타 성공`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryStar = _classThis;
})();
exports.RepositoryStar = RepositoryStar;
let RepositoryIssueCommentHeart = (() => {
    let _classDecorators = [Control.Service(`post`, `/api/repository/:repo_id/issue/:issue_id/comment/:node_id/heart`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RepositoryIssueCommentHeart = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            RepositoryIssueCommentHeart = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `하트 실패` };
            const verify = await getVerify(req);
            if (verify.data.status === 200) {
                const result = await mysql.execute(`SELECT * FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                if (result && Array.isArray(result[0])) {
                    if (result[0][0])
                        await mysql.execute(`DELETE FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                    else {
                        await mysql.execute(`INSERT INTO repository_issue_comment_heart (comment_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                        await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RIC.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 하트: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 댓글에 하트를 남겼습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? AND RIC.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.issue_id, req.params.node_id]);
                    }
                }
                response.status = 200;
                response.message = `하트 성공`;
            }
            res.send(JSON.stringify(response));
        }
    };
    return RepositoryIssueCommentHeart = _classThis;
})();
exports.RepositoryIssueCommentHeart = RepositoryIssueCommentHeart;
let Topics = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/topics/:category`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Topics = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Topics = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `토픽 목록 불러오기 실패` };
            let result;
            if (req.params.category === `all`)
                result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC LIMIT 100`);
            else
                result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 AND repo_category = ? ORDER BY R.created_at DESC LIMIT 100`, [req.params.category]);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `토픽 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return Topics = _classThis;
})();
exports.Topics = Topics;
let Categories = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/categories`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Categories = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Categories = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `카테고리 목록 불러오기 실패` };
            const result = await mysql.execute(`SELECT DISTINCT repo_category FROM repositories ORDER BY created_at DESC LIMIT 100`);
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `카테고리 목록 불러오기 성공`;
                response.data = result[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return Categories = _classThis;
})();
exports.Categories = Categories;
let Search = (() => {
    let _classDecorators = [Control.Service(`get`, `/api/search`)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Search = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Search = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        static async service(req, res, name) {
            res.setHeader(`Content-type`, `application/json`);
            const response = { status: 400, message: `검색 실패` };
            const resultRepos = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE (R.repo_name LIKE CONCAT("%", ?, "%") OR R.repo_category LIKE CONCAT("%", ?, "%") OR R.repo_subcategory LIKE CONCAT("%", ?, "%")) AND repo_archive = 0 AND repo_visibility = 1`, [req.query.q, req.query.q, req.query.q]);
            const resultUsers = await mysql.execute(`SELECT user_name, user_email, avatar_src, user_bio FROM users WHERE user_name LIKE CONCAT("%", ?, "%") OR user_email LIKE CONCAT("%", ?, "%")`, [req.query.q, req.query.q]);
            if (resultRepos && Array.isArray(resultRepos[0]) && resultUsers && Array.isArray(resultUsers[0])) {
                response.status = 200;
                response.message = `검색 성공`;
                response.data = {};
                response.data.repositories = resultRepos[0];
                response.data.users = resultUsers[0];
            }
            res.send(JSON.stringify(response));
        }
    };
    return Search = _classThis;
})();
exports.Search = Search;
Control.setRoutes(r2.r2);
Control.spawnListen();
