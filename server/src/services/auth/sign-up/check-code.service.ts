import { Code } from '@/types/declare';

import Express from 'express';

import { Funk } from '@/packages/framework/funk';
import { Response } from '@/packages/response';
import { mysql } from '@/index';

import { Oauth, RegEx } from '@/services/global';

// @Funk.Fetch({
//     user_email: 'ice1github@gmail.com',
//     code: '505912'
// })

@Funk.Body(true, 'user_email', RegEx.email)
@Funk.Body(true, 'code', /^[0-9]{6}$/)

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/oauth/check-code')
@Funk.Post

export class CheckCodeService {
    private user_email!: string;
    private code!: string;

    public async checkCode() {
        const result = await mysql.execute<Code[][]>(
            'SELECT * FROM code WHERE user_email = ? AND code = ?',
            [this.user_email, this.code]
        );

        return result?.[0][0];
    }

    public async deleteCode() {
        await mysql.execute<Code>(
            'DELETE FROM code WHERE user_email = ? AND code = ?',
            [this.user_email, this.code]
        );
    }

    public async insertUser(code: Code) {
        await mysql.execute(
            'INSERT INTO user (user_email, user_name, user_password) VALUES (?, ?, ?)',
            [this.user_email, code.user_name, code.user_password]
        );
    }
    
    public async service(req: Express.Request, res: Express.Response) {
        const response = new Response();
        response.status = 200;

        if (await Oauth.exists(this.user_email)) {
            response.status = 400;
            response.message = 'A user already subscribed to this email exists.';
            res.send(response.json());
            return;
        }
        
        const code = await this.checkCode();

        if (!code) {
            response.status = 400;
            response.message = 'The authentication number does not match.';
            res.send(response.json());
            return;
        }

        await this.deleteCode();
        await this.insertUser(code);

        response.message = 'Signup successful.';
        res.send(response.json());
    }
}
