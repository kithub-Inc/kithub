import Express from 'express';
import fs from 'fs/promises';
import dotenv from 'dotenv';

import { Funk } from '@/packages/framework/funk';
import { Response } from '@/packages/response';
import { JWT } from '@/packages/jwt';

import { Oauth, RegEx } from '@/services/global';

dotenv.config();

// @Funk.Fetch({
//     user_email: 'ice1github@gmail.com',
//     user_password: 'Dy12249443!!@@'
// })

@Funk.Body(true, 'user_email', RegEx.email)
@Funk.Body(true, 'user_password', RegEx.password)

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/oauth/sign-in')
@Funk.Post

export class SignInService {
    private user_email!: string;
    private user_password!: string;
    
    public async service(req: Express.Request, res: Express.Response) {
        const response = new Response();
        response.status = 200;

        const exists = await Oauth.sign(this.user_email, this.user_password);

        if (!exists) {
            response.status = 400;
            response.message = 'The corresponding user does not exist. Please check your email or password.';
            res.send(response.json());
            return;
        }

        const accessToken = JWT.sign({ user_email: this.user_email }, '14 days');
        // await fs.writeFile('./.tkn', accessToken);
        
        response.message = 'Signin successful.';
        response.data = { accessToken };

        res.send(response.json());
    }
}
