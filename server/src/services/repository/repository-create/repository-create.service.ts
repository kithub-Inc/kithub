import { Insert, Repository, User } from '@/types/declare';

import Express from 'express';
import dotenv from 'dotenv';

import { Funk } from '@/packages/framework/funk';
import { HeaderParser } from '@/packages/parser';
import { Response } from '@/packages/response';
import { mysql, storage } from '@/index';

import { Oauth } from '@/services/global';

import { EventType, runner } from '@/functions/runner';
import { uuid } from '@/functions/uuid';

dotenv.config();

// @Funk.Fetch({
//     repo_name: 'umm',
//     repo_description: '🎬 anything...',
//     repo_license: 'mit'
// })

// @Funk.Auth(process.env.DEV_MODE_JWT || '')

@Funk.Body(true, 'repo_name', /^[a-zA-Z0-9-_/ ]+$/i)
@Funk.Body(false, 'repo_description', /^[\s\S]+$/i)
@Funk.Body(true, 'repo_license', /^(mit|apach 2.0)$/i)
@Funk.Body(false, 'no_branch', 'boolean')

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/repository/create')
@Funk.Post

export class RepositoryCreateService {
    private repo_name!: string;
    private repo_description!: string;
    private repo_license!: string;
    private no_branch: boolean = false;

    public async existsRepository(user: User) {
        const result = await mysql.execute<Repository[][]>(
            'SELECT * FROM repository WHERE user_email = ? AND repo_name = ?',
            [user.user_email, this.repo_name]
        );

        return result?.[0][0];
    }

    public async insertRepository(user: User) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO repository (user_email, group_id, repo_name, repo_description, repo_license) VALUES (?, ?, ?, ?, ?)',
            [user.user_email, -1, this.repo_name, this.repo_description || '', this.repo_license]
        );
    }

    public async updateRepository(user: User, path: string) {
        return await mysql.execute<Insert[]>(
            'UPDATE repository SET repo_path = ? WHERE user_email = ? AND repo_name = ?',
            [path, user.user_email, this.repo_name]
        );
    }

    public async insertBranch(user: User, repo_id: number) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO branch (user_email, repo_id, branch_name, branch_description) VALUES (?, ?, ?, ?)',
            [user.user_email, repo_id, 'main', '초기 브랜치']
        );
    }

    public async updateBranch(user: User, path: string) {
        return await mysql.execute<Insert[]>(
            'UPDATE branch SET branch_path = ? WHERE user_email = ? AND branch_name = ?',
            [path, user.user_email, 'main']
        );
    }

    public async insertCommitGroup(user: User, repo_id: number, branch_id: number) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO commit_group (group_id, user_email, repo_id, branch_id) VALUES (?, ?, ?, ?)',
            [uuid(), user.user_email, repo_id, branch_id]
        );
    }

    public async updateCommitGroup(user: User, path: string, group_id: number) {
        return await mysql.execute<Insert[]>(
            'UPDATE commit_group SET group_path = ? WHERE user_email = ? AND node_id = ?',
            [path, user.user_email, group_id]
        );
    }

    public async insertCommit(user: User, group_id: number) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO commit (user_email, commit_group_id, commit_name) VALUES (?, ?, ?)',
            [user.user_email, group_id, '첫번 째 커밋']
        );
    }

    public async updateCommit(user: User, group_id: number, path: string) {
        return await mysql.execute<Insert[]>(
            'UPDATE commit SET commit_path = ? WHERE user_email = ? AND commit_group_id = ?',
            [path, user.user_email, group_id]
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

        if (await this.existsRepository(user)) {
            response.status = 400;
            response.message = 'A repository with that name already exists.';
            res.send(response.json());
            return;
        }

        const insertRepository = await this.insertRepository(user);
        const repo_path = `data/${user.user_email}/${insertRepository?.[0].insertId}`;
        await this.updateRepository(user, repo_path);

        if (!this.no_branch) {
            const insertBranch = await this.insertBranch(user, (insertRepository?.[0] as Insert).insertId);
            const branch_path = `${repo_path}/main`;
            await this.updateBranch(user, branch_path);

            const insertCommitGroup = await this.insertCommitGroup(user, (insertRepository?.[0] as Insert).insertId, (insertBranch?.[0] as Insert).insertId);
            const group_path = `${branch_path}/${(insertCommitGroup?.[0] as Insert).insertId}`;
            await this.updateCommitGroup(user, group_path, (insertCommitGroup?.[0] as Insert).insertId);
    
            const insertCommit = await this.insertCommit(user, (insertBranch?.[0] as Insert).insertId);
            const commit_path = `${group_path}/${insertCommit?.[0].insertId}`;
            await this.updateCommit(user, (insertCommit?.[0] as Insert).insertId, commit_path);
            await storage.put(`${commit_path}/README.md`, `# ${this.repo_name}`);
        }

        const event = await runner(user.user_email, EventType.OnRepositoryCreate);

        response.message = 'Successfully created the repository.';
        response.data = {
            repo_id: insertRepository?.[0].insertId,
            event: event
        };
        res.send(response.json());
    }
}
