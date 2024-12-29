import Express from 'express';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';
import juice from 'juice';

import { Funk } from '@/packages/framework/funk';
import { Response } from '@/packages/response';
import { mysql, Mail } from '@/index';

import { Oauth, RegEx } from '@/services/global';

dotenv.config();

// @Funk.Fetch({
//     user_email: 'ice1github@gmail.com',
//     user_name: 'ICe1BotMaker',
//     user_password: 'Dy12249443!!@@'
// })

@Funk.Body(true, 'user_email', RegEx.email)
@Funk.Body(true, 'user_name', RegEx.name)
@Funk.Body(true, 'user_password', RegEx.password)

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/oauth/sign-up')
@Funk.Post

export class SignUpService {
    private user_email!: string;
    private user_name!: string;
    private user_password!: string;

    public async insertCode() {
        let code = '';
        for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10).toString();
        const password = crypto.createHash('sha512').update(this.user_password + process.env.SECRET_KEY).digest('hex');
    
        await mysql.execute(
            'INSERT INTO code (user_email, user_name, user_password, code) VALUES (?, ?, ?, ?)',
            [this.user_email, this.user_name, password, code]
        );
    
        return code;
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

        const html = juice(await fs.readFile(`${__dirname}/email.html`, 'utf-8'), { preserveFontFaces: true });
        const code = await this.insertCode();

        Mail.send({
            from: 'kithubclone@gmail.com',
            to: this.user_email,

            subject: '[hubof] 인증 메일이 도착하였습니다.',
            html: html.replace(/\{code-([0-9])\}/g, (_, idx) => code[idx - 1])
        });
        
        response.message = 'Authentication mail has been sent.';
        res.send(response.json());
    }
}
