/* eslint-disable @typescript-eslint/no-explicit-any */

import mysql, { Pool, QueryResult, FieldPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Mysql {
    public connection: Pool;

    public constructor() {
        this.connection = mysql.createPool({
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

    public async getConnection(): Promise<mysql.PoolConnection | void> {
        try {
            const connection = await this.connection.getConnection();
            return connection;

        } catch (error: any) {
            console.log(error);
        }
    }

    public async execute(query: string, data: any[] = []): Promise<[QueryResult, FieldPacket[]] | void> {
        const connection = await this.getConnection();

        if (connection) {
            try {
                await connection.beginTransaction();
                const result = await connection.query(query, data);
                await connection.commit();
                return result;
            
            } catch (error: any) {
                console.log(error);
                await connection.rollback();
            
            } finally {
                connection.release();
            }
        }
    }
}

export { Mysql };