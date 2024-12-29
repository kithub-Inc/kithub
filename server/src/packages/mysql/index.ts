/* eslint-disable @typescript-eslint/no-explicit-any */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export class Mysql {
    private connection: mysql.Pool;

    public constructor() {
        this.connection = mysql.createPool({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            port: 3306,
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10,
            idleTimeout: 60000,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });
    }

    public async execute<T>(query: string, data: any[]): Promise<T | undefined> {
        const connection = await this.connection.getConnection();

        try {
            await connection.beginTransaction();
            const result = await connection.query(query, data);
            await connection.commit();
            return result as unknown as T;

        } catch (error) {
            console.log(error);
            await connection.rollback();

        } finally {
            connection.release();
        }
    }
}
