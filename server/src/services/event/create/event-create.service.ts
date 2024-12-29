import Express from 'express';
import dotenv from 'dotenv';

import { Parser } from '@/packages/porrg/lib/Parser';
import { Lexer } from '@/packages/porrg/lib/Lexer';
import { Funk } from '@/packages/framework/funk';
import { HeaderParser } from '@/packages/parser';
import { Response } from '@/packages/response';
import { mysql } from '@/index';

import { Oauth } from '@/services/global';
import { EventType } from '@/functions/runner';

dotenv.config();

// @Funk.Fetch({
//     event_name: 'CREATE CI/CD',
//     event_description: '대충 이상한 씨아이씨디를 구현해보았으빈다 ㅉㅈㅈㅈ',
//     event_porrg: `var count = 0;

//     function Component(title: String) {
//         return #Layout => (
//             children: [
//                 #Text => (
//                     text: title
//                 ),
//                 #Text => (
//                     text: 'count: $count'
//                 ),
//                 #Button => (
//                     text: 'click me!',
//                     click: lambda () => {
//                         rep count = count + 1;
//                     }
//                 ),
//             ]
//         );
//     }

//     function app() {
//         return #Component => (
//             title: 'simple count app'
//         );
//     }

//     function first() {
//         print "[log] first log message";
//     }

//     function second() {
//         print "[log] second log message";
//     }

//     export { app, first, second };
//     `,
//     event_type: EventType.OnRepositoryCreate,
// })

// @Funk.Auth(process.env.DEV_MODE_JWT || '')

@Funk.Body(true, 'event_name', /^.*$/i)
@Funk.Body(true, 'event_description', 'string')
@Funk.Body(true, 'event_porrg', 'string')
@Funk.Body(true, 'event_type', new RegExp(`^(${Object.values(EventType).join('|')})$`))

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/event/create')
@Funk.Post

export class EventCreateService {
    private event_name!: string;
    private event_description!: string;
    private event_porrg!: string;
    private event_type!: string;

    public async service(req: Express.Request, res: Express.Response) {
        const response = new Response();
        response.status = 200;
        
        const bearer = HeaderParser.Bearer(req.headers.authorization ?? '');
        if (!bearer) {
            response.status = 400;
            response.message = 'This is a non-existent user.';
            res.send(response.json());
            return;
        }

        const user = await Oauth.verify(bearer.user_email);

        if (!user) {
            response.status = 400;
            response.message = 'This is a non-existent user.';
            res.send(response.json());
            return;
        }

        try {
            const lexer = new Lexer(this.event_porrg);
            const tokens = lexer.tokenize();
            
            const parser = new Parser(tokens);
            const ast = parser.parse();

            await mysql.execute(
                'INSERT INTO event (user_email, type, content, event_name, event_description) VALUES (?, ?, ?, ?, ?)',
                [user.user_email, this.event_type, JSON.stringify(ast), this.event_name, this.event_description]
            );
            
            response.message = 'Successfully created the event.';
            res.send(response.json());

        } catch {
            response.message = 'Invalid event properties.';
            res.send(response.json());
        }
    }
}
