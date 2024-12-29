import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export class JWT {
    public static sign(payload : object, expiresIn : string | number) {
        if (!process.env.SECRET_KEY) throw new Error('\'SECRET_KET\' 가 존재하지 않습니다.');
        return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn });
    }
    
    public static verify(token : string) {
        if (!process.env.SECRET_KEY) throw new Error('\'SECRET_KET\' 가 존재하지 않습니다.');

        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            return { payload: decoded, expired: false };

        } catch (error) {
            return { payload: null, expired: !!error };
        }
    }
}
