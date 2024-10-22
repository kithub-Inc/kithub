"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mysql = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Mysql {
    connection;
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
    async getConnection() {
        try {
            const connection = await this.connection.getConnection();
            return connection;
        }
        catch (error) {
            console.log(error);
        }
    }
    async execute(query, data = []) {
        const connection = await this.getConnection();
        if (connection) {
            try {
                await connection.beginTransaction();
                const result = await connection.query(query, data);
                await connection.commit();
                return result;
            }
            catch (error) {
                console.log(error);
                await connection.rollback();
            }
            finally {
                connection.release();
            }
        }
    }
}
exports.Mysql = Mysql;
