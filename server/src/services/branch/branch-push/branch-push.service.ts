/* eslint-disable @typescript-eslint/no-explicit-any */

import { Branch, Commit, CommitGroup, Insert, Repository, User } from '@/types/declare';

import Express from 'express';
import fs from 'fs/promises';
import dotenv from 'dotenv';

import { Funk } from '@/packages/framework/funk';
import { HeaderParser } from '@/packages/parser';
import { Response } from '@/packages/response';
import { mysql, storage } from '@/index';

import { Oauth } from '@/services/global';
import { uuid } from '@/functions/uuid';

dotenv.config();

@Funk.Header('Content-type', 'application/json')
@Funk.Logger({ save: false })

@Funk.Service('/branch/push')
@Funk.Post

export class BranchPushService {
    public async findPrevCommit(user: User, branch_id: number) {
        const group = await mysql.execute<CommitGroup[][]>(
            'SELECT * FROM commit_group WHERE user_email = ? AND branch_id = ? ORDER BY node_id DESC LIMIT 1, 1',
            [user.user_email, branch_id]
        );

        if (group?.[0][0]) {
            const commit = await mysql.execute<Commit[][]>(
                'SELECT * FROM commit WHERE user_email = ? AND commit_group_id = ? ORDER BY node_id DESC LIMIT 1',
                [user.user_email, group?.[0][0].node_id || -1]
            );

            return commit?.[0][0];
            
        } else {
            const group = await mysql.execute<CommitGroup[][]>(
                'SELECT * FROM commit_group WHERE user_email = ? AND branch_id = ? ORDER BY node_id DESC LIMIT 1',
                [user.user_email, branch_id]
            );

            const commit = await mysql.execute<Commit[][]>(
                'SELECT * FROM commit WHERE user_email = ? AND commit_group_id = ? ORDER BY node_id DESC LIMIT 1, 1',
                [user.user_email, group?.[0][0].node_id || -1]
            );

            return commit?.[0][0];
        }
    }

    public async existsRepository(user: User, repo_name: string) {
        const result = await mysql.execute<Repository[][]>(
            'SELECT * FROM repository WHERE user_email = ? AND repo_name = ?',
            [user.user_email, repo_name]
        );

        return result?.[0][0];
    }

    public async existsBranch(user: User, branch_name: string) {
        const result = await mysql.execute<Branch[][]>(
            'SELECT * FROM branch WHERE user_email = ? AND branch_name = ?',
            [user.user_email, branch_name]
        );

        return result?.[0][0];
    }

    public async insertCommitGroup(id: string, user: User, repo_id: number, branch_id: number) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO commit_group (group_id, user_email, repo_id, branch_id) VALUES (?, ?, ?, ?)',
            [id, user.user_email, repo_id, branch_id]
        );
    }

    public async updateCommitGroup(user: User, path: string, group_id: number) {
        return await mysql.execute<Insert[]>(
            'UPDATE commit_group SET group_path = ? WHERE user_email = ? AND node_id = ?',
            [path, user.user_email, group_id]
        );
    }

    public async insertCommit(user: User, group_id: number, commit_name: string) {
        return await mysql.execute<Insert[]>(
            'INSERT INTO commit (user_email, commit_group_id, commit_name) VALUES (?, ?, ?)',
            [user.user_email, group_id, commit_name]
        );
    }

    public async updateCommit(user: User, path: string, commit_id: number) {
        return await mysql.execute<Insert[]>(
            'UPDATE commit SET commit_path = ? WHERE user_email = ? AND node_id = ?',
            [path, user.user_email, commit_id]
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

        const repo = await this.existsRepository(user, req.body.repo_name);

        if (!repo) {
            response.status = 400;
            response.message = 'This is a non-existent repository.';
            res.send(response.json());
            return;
        }

        const branch = await this.existsBranch(user, req.body.branch_name);

        if (!branch) {
            response.status = 400;
            response.message = 'This is a non-existent branch.';
            res.send(response.json());
            return;
        }

        if (!req.files || req.files.length === 0) {
            response.status = 400;
            response.message = 'There are no files to be registered.';
            res.send(response.json());
            return;
        }
        
        const id = uuid();

        const insertCommitGroup = await this.insertCommitGroup(id, user, repo.node_id, branch.node_id);
        const group_path = `${branch.branch_path}/${(insertCommitGroup?.[0] as Insert).insertId}`;
        await this.updateCommitGroup(user, group_path, (insertCommitGroup?.[0] as Insert).insertId);
    
        const descriptions = JSON.parse(req.body.commit_descriptions) as { description: string; added: string[] }[];
        const origin = JSON.parse(req.body.origin) as { origin: string; insert: string }[];

        for (const desc of descriptions) {
            const insertCommit = await this.insertCommit(user, (insertCommitGroup?.[0] as Insert).insertId, desc.description);
            const commit_path = `${group_path}/${insertCommit?.[0].insertId}`;
            await this.updateCommit(user, commit_path, (insertCommit?.[0] as Insert).insertId);

            const prev_commit = await this.findPrevCommit(user, branch.node_id);
            if (prev_commit) storage.copyFolder(prev_commit.commit_path, commit_path);

            for (const filename of desc.added) {
                const newOrigin = origin.find(e => e.origin === filename);
                const file: globalThis.Express.Multer.File = (req.files as any[]).find(e => e.filename === newOrigin?.insert);
                
                await storage.put(`${commit_path}/${newOrigin?.origin}`, await fs.readFile(file.path));
                await fs.unlink(file.path);
            }
        }

        response.message = 'Successfully created the branch.';
        response.data = { uuid: id };
        res.send(response.json());
    }
}
