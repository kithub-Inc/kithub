import Express from 'express';
import dotenv from 'dotenv';

import { Funk } from '@/packages/framework/funk';
import { HeaderParser } from '@/packages/parser';
import { Response } from '@/packages/response';

import { Oauth } from '@/services/global';

dotenv.config();

// @Funk.Auth(process.env.DEV_MODE_JWT || '')

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/oauth/token/verify')
@Funk.Get

export class TokenVerifyService {
    public async service(req: Express.Request, res: Express.Response) {
        const response = new Response();
        response.status = 200;
        
        const bearer = HeaderParser.Bearer(req.headers.authorization ?? '');
        if (!bearer) {
            response.status = 400;
            response.message = '존재하지 않는 유저입니다.';
            res.send(response.json());
            return;
        }

        const user = await Oauth.verify(bearer?.user_email);

        if (!user) {
            response.status = 400;
            response.message = '존재하지 않는 유저입니다.';
            res.send(response.json());
            return;
        }

        response.message = '존재하는 유저입니다.';
        response.data = user;
        res.send(response.json());
    }
}
