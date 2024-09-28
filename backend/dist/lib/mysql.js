"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mysql = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Mysql {
    constructor() {
        this.connection = promise_1.default.createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            port: Number(process.env.DATABASE_PORT), // 3306
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10,
            idleTimeout: 60000,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const connection = yield this.connection.getConnection();
                return connection;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    execute(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, data = []) {
            const connection = yield this.getConnection();
            if (connection) {
                try {
                    yield connection.beginTransaction();
                    const result = yield connection.query(query, data);
                    yield connection.commit();
                    return result;
                }
                catch (error) {
                    console.log(error);
                    yield connection.rollback();
                }
                finally {
                    connection.release();
                }
            }
        });
    }
}
exports.Mysql = Mysql;
