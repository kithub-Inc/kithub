import { User } from '@/types/declare';
import { mysql } from '@/index';
import crypto from 'crypto';

export const RegEx = {
    email: /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i,
    password: /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,15}$/,
    name: /^[a-zA-Z0-9-_ ]+$/i,
};

export class Oauth {
    public static async exists(user_email: string) {
        const result = await mysql.execute<boolean[][]>(
            'SELECT * FROM user WHERE user_email = ?',
            [user_email]
        );

        return !!result?.[0][0];
    }

    public static async verify(user_email: string): Promise<User | undefined> {
        const result = await mysql.execute<User[][]>(
            'SELECT * FROM user WHERE user_email = ?',
            [user_email]
        );

        delete result?.[0][0].user_password;
        return result?.[0][0];
    }

    public static async sign(user_email: string, user_password: string) {
        const password = crypto.createHash('sha512').update(user_password + process.env.SECRET_KEY).digest('hex');

        const result = await mysql.execute<User[][]>(
            'SELECT * FROM user WHERE user_email = ? AND user_password = ?',
            [user_email, password]
        );

        return result?.[0][0];
    }
}
