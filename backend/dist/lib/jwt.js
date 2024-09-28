"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshVerify = exports.refreshToken = exports.verify = exports.accessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const accessToken = (user_email) => jsonwebtoken_1.default.sign({ user_email }, JWT_SECRET, { expiresIn: `24h` });
exports.accessToken = accessToken;
const verify = (token) => {
    const response = { status: 400 };
    try {
        const { user_email } = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        response.status = 200;
        response.data = { user_email };
        return response;
    }
    catch (error) {
        response.message = error.message;
        return response;
    }
};
exports.verify = verify;
const refreshToken = (user_email) => jsonwebtoken_1.default.sign({ user_email }, JWT_SECRET, { expiresIn: `14d` });
exports.refreshToken = refreshToken;
const refreshVerify = (token) => {
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.refreshVerify = refreshVerify;
