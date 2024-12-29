import { Insert, Repository, User } from '@/types/declare';

import Express from 'express';
import dotenv from 'dotenv';

import { Funk } from '@/packages/framework/funk';
import { HeaderParser } from '@/packages/parser';
import { Response } from '@/packages/response';
import { mysql } from '@/index';

import { Oauth } from '@/services/global';

dotenv.config();

// @Funk.Fetch({
//     repo_name: 1,
//     branch_name: 'deploy',
//     branch_description: 'cicd pipe deploy-branch',
// })

// @Funk.Auth(process.env.DEV_MODE_JWT || '')

@Funk.Body(true, 'repo_name', /^[a-zA-Z0-9-_/ ]+$/i)
@Funk.Body(true, 'branch_name', /^[a-z0-9-_/ ]+$/i)
@Funk.Body(false, 'branch_description', /^[\s\S]+$/i)

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/branch/create')
@Funk.Post

export class BranchCreateService {
    private repo_name!: string;
    private branch_name!: string;
    private branch_description!: string;

    public async existsRepository(user: User) {
        const result = await mysql.execute<Repository[][]>(
            'SELECT * FROM repository WHERE user_email = ? AND repo_name = ?',
            [user.user_email, this.repo_name]
        );

        return result?.[0][0];
    }

    public async existsBranch(user: User, repo_id: number) {
        const result = await mysql.execute<Repository[][]>(
            'SELECT * FROM branch WHERE user_email = ? AND repo_id = ? AND branch_name = ?',
            [user.user_email, repo_id, this.branch_name]
        );

        return !!result?.[0][0];
    }

    public async insertBranch(user: User, repo_id: number) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO branch (user_email, repo_id, branch_name, branch_description) VALUES (?, ?, ?, ?)',
            [user.user_email, repo_id, this.branch_name, this.branch_description]
        );
    }

    public async updateBranch(user: User, path: string) {
        return await mysql.execute<Insert[]>(
            'UPDATE branch SET branch_path = ? WHERE user_email = ? AND branch_name = ?',
            [path, user.user_email, this.branch_name]
        );
    }
    
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

        const repo = await this.existsRepository(user);

        if (!repo) {
            response.status = 400;
            response.message = 'This is a non-existent repository.';
            res.send(response.json());
            return;
        }

        if (await this.existsBranch(user, repo.node_id)) {
            response.status = 400;
            response.message = 'A branch with that name already exists.';
            res.send(response.json());
            return;
        }

        const insertBranch = await this.insertBranch(user, repo.node_id);
        const branch_path = `${repo.repo_path}/${insertBranch?.[0].insertId}`;
        await this.updateBranch(user, branch_path);

        response.message = 'Successfully created the branch.';
        response.data = insertBranch?.[0].insertId;
        res.send(response.json());
    }
}
