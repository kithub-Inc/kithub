/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Status } from './status';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtPayload {
    user_email: string;
}

const accessToken = (user_email: string) => jwt.sign({ user_email }, JWT_SECRET, { expiresIn: `24h` });
const verify = (token: string) => {
    const response: Status = { status: 400 };

    try {
        const { user_email } = jwt.verify(token, JWT_SECRET) as JwtPayload;
        response.status = 200;
        response.data = { user_email };
        return response;
    
    } catch (error: any) {
        response.message = error.message;
        return response;
    }
}

const refreshToken = (user_email: string) => jwt.sign({ user_email }, JWT_SECRET, { expiresIn: `14d` });
const refreshVerify = (token: string) => {
    try {
        jwt.verify(token, JWT_SECRET);
        return true;
    
    } catch (error: any) {
        return false;
    }
}

export { JwtPayload, accessToken, verify, refreshToken, refreshVerify };