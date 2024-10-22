/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-escape */

import { FieldPacket, QueryResult } from 'mysql2';
import { Request, Response } from 'express';
import { R2 } from 'node-cloudflare-r2';
import nodemailer from 'nodemailer';
import otp from 'otp-generator';
import { OpenAI } from 'openai';
import crypto from 'crypto';

import { accessToken, verify } from './lib/jwt';
import { Controller } from './lib/framework';
import { Status } from './lib/status';
import { Mysql } from './lib/mysql';

const mysql: Mysql = new Mysql();
const Control: Controller = new Controller();
const transporter = nodemailer.createTransport({
    host: `smtp.gmail.com`,
    port: 587,
    secure: false,
    auth: {
        user: process.env.GOOGLE_APP_EMAIL,
        pass: process.env.GOOGLE_APP_KEY
    }
});
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.ORGANIZATION_ID
});
const r2 = new R2({
    accountId: process.env.ACCOUNT_ID || ``,
    accessKeyId: process.env.ACCESS_KEY_ID || ``,
    secretAccessKey: process.env.SECRET_ACCESS_KEY || ``
});
const bucket = r2.bucket(`object-storage`);
bucket.provideBucketPublicUrl(process.env.PUBLIC_URL || ``);


const recursion = async (path: string) => {
    const items = (await bucket.listObjects()).objects;

    const buildStructure = async (pre: Promise<any[]>, cur: any) => {
        const splits = cur.key.split(`/`).slice(5);
        let current = await pre;

        for (let idx = 0; idx < splits.length; idx++) {
            const part = splits[idx];
            const existing = current.find((item: any) => item.name === part);

            if (idx === splits.length - 1) {
                const content = bucket.getObjectPublicUrls(cur.key)[0];
                const response = await (await fetch(content)).text();
                if (!existing) current.push({ path: cur.key, name: part, type: `file`, public: content, content: response });

            } else {
                if (!existing) {
                    const newFolder = { path: cur.key, name: part, type: `folder`, public: ``, content: [] };
                    current.push(newFolder);
                    current = newFolder.content;

                } else current = existing.content;
            }
        }

        return pre;
    }

    const filter = items.filter(e => `${e.key}`.startsWith(path));
    return await filter.reduce(buildStructure, Promise.resolve([]));
}

const getVerify = async (req: any) => {
    return { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };
}

const getGrantes = async (req: any) => {
    return { data: await RepositoryGrantes.service({ params: { node_id: req.params.repo_id } } as any, { send: () => {}, setHeader: () => {} } as any) };
}


@Control.Service(`post`, `/api/v1/user/otp`)
export class OauthOTP {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `로그인 실패` };
        const result = await mysql.execute(`SELECT * FROM otps WHERE user_email = ? AND code = ?`, [req.body.user_email, req.body.code]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { node_id: number; user_email: string; };

            await mysql.execute(`DELETE FROM otps WHERE node_id = ?`, [data.node_id]);

            const device = await mysql.execute(`SELECT * FROM user_device WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
            if (device && Array.isArray(device[0]) && device[0][0]) await mysql.execute(`UPDATE user_device SET updated_at = NOW() WHERE user_email = ? AND device_agent = ?`, [req.body.user_email, req.headers[`user-agent`]]);
            else await mysql.execute(`INSERT INTO user_device (user_email, device_agent) VALUES (?, ?)`, [req.body.user_email, req.headers[`user-agent`]]);

            response.status = 200;
            response.message = `로그인 성공`;
            response.data = { accessToken: accessToken(data.user_email) };
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/v1/user/signin`)
export class OauthSignIn {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `인증메일 전송 실패` };

        if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
            const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ? AND user_password = ?`, [req.body.user_email, crypto.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
            
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0] as { user_email: string; };
                const code = otp.generate(4, { upperCaseAlphabets: false, specialChars: false });
    
                await mysql.execute(`INSERT INTO otps (user_email, code) VALUES (?, ?)`, [data.user_email, code]);
                
                transporter.sendMail({
                    from: process.env.GOOGLE_APP_EMAIL,
                    to: data.user_email,
                    subject: `[kithub-inc] 킷허브 이메일 2차 인증`,
                    html: `인증코드: ${code}`
                });
    
                response.status = 200;
                response.message = `인증메일 전송 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/v1/user/signup`)
export class OauthSignUp {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `회원가입 실패` };

        if (/([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/.test(req.body.user_email)) {
            const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.body.user_email]);
            
            if (result && Array.isArray(result[0]) && !result[0][0]) {
                const insert = await mysql.execute(`INSERT INTO users (user_email, user_password) VALUES (?, ?)`, [req.body.user_email, crypto.createHash(`sha512`).update(req.body.user_password).digest(`hex`)]);
                
                if (insert) {
                    response.status = 200;
                    response.message = `회원가입 성공, 로그인 필요`;
                }
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/v1/user/verify`)
export class OauthVerify {
    public static async service(req: Request, res: Response, name?: any): Promise<Status> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: { data?: { node_id?: number; user_email?: string; user_name?: any; user_bio?: string; } | undefined; status: number; message?: string; } = verify(req.body.accessToken);
        response.status = 400;
        response.message = `로그인 정보 확인 실패`;

        if (response.data?.user_email) {
            let result: [QueryResult, FieldPacket[]] | void;
            if (!req.body.agent) result = await mysql.execute(`SELECT U.* FROM users AS U JOIN user_device AS UD ON U.user_email = UD.user_email WHERE U.user_email = ? AND UD.device_agent = ?`, [response.data.user_email, req.headers[`user-agent`]]);
            else result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [response.data.user_email]);

            if (result && Array.isArray(result[0]) && result[0][0]) {
                const data = result[0][0] as { node_id: number; user_email: string; user_name: string; user_bio: string; user_password: string; };
                data.user_password = `(secure)`;

                response.status = 200;
                response.message = `로그인 정보 확인 성공`;
                response.data = data;

            } else {
                response.data = {};
            }
        }

        res.send(JSON.stringify(response));
        return response;
    }
}


@Control.Service(`get`, `/api/user/:user_email`)
export class User {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: Status = { status: 400, message: `유저 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM users WHERE user_email = ?`, [req.params.user_email]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `유저 불러오기 성공`;
            response.data = result[0][0];
            response.data.user_password = `(secure)`;
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/view-private`)
export class UserViewPrivate {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 목록 불러오기 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
            const result = await mysql.execute(`SELECT U.user_name, R.* FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.user_email = ? ORDER BY R.created_at DESC`, [req.body.user_email]);

            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `레포지토리 목록 불러오기 성공`;
                response.data = result[0];
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/devices`)
export class UserDevices {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: Status = { status: 400, message: `디바이스 목록 불러오기 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            const result = await mysql.execute(`SELECT * FROM user_device WHERE user_email = ?`, [verify.data.data.user_email]);
            
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `디바이스 목록 불러오기 성공`;
                response.data = result[0];
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/device/remove`)
export class UserDeviceRemove {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: Status = { status: 400, message: `디바이스 제거 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            const result = await mysql.execute(`DELETE FROM user_device WHERE user_email = ? AND device_agent = ?`, [verify.data.data.user_email, req.body.agent]);
            
            if (result) {
                response.status = 200;
                response.message = `디바이스 제거 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/alerts`)
export class UserAlerts {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: Status = { status: 400, message: `알림 목록 불러오기 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            let result: any;

            if (req.body?.limit) result = await mysql.execute(`SELECT * FROM user_alert WHERE user_email = ? ORDER BY created_at DESC LIMIT 5`, [verify.data.data.user_email]);
            else result = await mysql.execute(`SELECT * FROM user_alert WHERE user_email = ? ORDER BY created_at DESC`, [verify.data.data.user_email]);
            
            if (result && Array.isArray(result[0])) {
                response.status = 200;
                response.message = `알림 목록 불러오기 성공`;
                response.data = result[0];
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/alert`)
export class UserAlert {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);
        
        const response: Status = { status: 400, message: `알림 읽기 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            req.body.ids.forEach(async (id: number) => await mysql.execute(`UPDATE user_alert SET alert_read = 1 WHERE node_id = ? AND user_email = ?`, [id, verify.data.data.user_email]));
            
            response.status = 200;
            response.message = `알림 읽기 성공`;
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/modify/avatar`)
export class UserModifyAvatar {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `아바타 수정 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email && req.file) {
            let update;
            if (name) update = await mysql.execute(`UPDATE users SET avatar_src = ? WHERE user_email = ?`, [`${process.env.PUBLIC_URL}/${name.key}`, req.body.user_email]);
    
            if (update) {
                response.status = 200;
                response.message = `아바타 수정 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/modify/name`)
export class UserModifyName {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이름 수정 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
            const update = await mysql.execute(`UPDATE users SET user_name = ? WHERE user_email = ?`, [req.body.user_name, req.body.user_email]);

            if (update) {
                response.status = 200;
                response.message = `이름 수정 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/modify/bio`)
export class UserModifyBio {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `설명 수정 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
            const update = await mysql.execute(`UPDATE users SET user_bio = ? WHERE user_email = ?`, [req.body.user_bio, req.body.user_email]);

            if (update) {
                response.status = 200;
                response.message = `설명 수정 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/modify/password`)
export class UserModifyPassword {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `비밀번호 수정 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email === req.body.user_email) {
            const update = await mysql.execute(`UPDATE users SET user_password = ? WHERE user_email = ?`, [crypto.createHash(`sha512`).update(req.body.user_password).digest(`hex`), req.body.user_email]);

            if (update) {
                response.status = 200;
                response.message = `비밀번호 수정 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/user/follow`)
export class UserFollow {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `팔로우 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200 && verify.data.data.user_email !== req.body.user_email) {
            const result = await mysql.execute(`SELECT * FROM user_follow WHERE user_email = ? AND target_email = ?`, [verify.data.data.user_email, req.body.user_email]);

            if (result && Array.isArray(result[0]) && result[0][0]) await mysql.execute(`DELETE FROM user_follow WHERE user_email = ? AND target_email = ?`, [verify.data.data.user_email, req.body.user_email]);
            else {
                await mysql.execute(`INSERT INTO user_follow (user_email, target_email) VALUES (?, ?)`, [verify.data.data.user_email, req.body.user_email]);
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, CONCAT("/", U.user_email), CONCAT("새 팔로워: @", IFNULL(U.user_name, U.user_email)), CONCAT(IFNULL(U.user_name, U.user_email), "님이 당신을 팔로우하기 시작했습니다.") FROM users AS U WHERE U.user_email = ?`, [req.body.user_email, verify.data.data.user_email]);
            }
            
            response.status = 200;
            response.message = `팔로우 성공`;
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/:user_email/following`)
export class UserFollowing {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `팔로잉 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT U.user_email, U.user_name, U.avatar_src, U.user_bio, UF.created_at FROM user_follow AS UF JOIN users AS U ON UF.target_email = U.user_email WHERE UF.user_email = ?`, [req.params.user_email]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `팔로잉 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/:user_email/follower`)
export class UserFollower {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `팔로워 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT U.user_email, U.user_name, U.avatar_src, U.user_bio, UF.created_at FROM user_follow AS UF JOIN users AS U ON UF.user_email = U.user_email WHERE UF.target_email = ?`, [req.params.user_email]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `팔로워 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}


@Control.Service(`get`, `/api/:user_email/repositories`)
export class Repositories {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.user_email = ? AND repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC`, [req.params.user_email]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `레포지토리 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:node_id`)
export class Repository {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 불러오기 실패` };
        const result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
        const grantes = await mysql.execute(`SELECT RA.* FROM repository_authorities AS RA JOIN repositories AS R ON RA.repo_id = R.node_id WHERE RA.repo_id = ? AND repo_archive = 0 AND repo_visibility = 1`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0] && grantes && Array.isArray(grantes[0])) {
            response.status = 200;
            response.message = `레포지토리 불러오기 성공`;
            response.data = result[0][0];
            response.data.repo_grantes = grantes[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:node_id/grantes`)
export class RepositoryGrantes {
    public static async service(req: Request, res: Response, name?: any): Promise<Status> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `권한 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_authorities WHERE repo_id = ?`, [req.params.node_id]);

        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `권한 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
        return response;
    }
}

@Control.Service(`get`, `/api/repository/:node_id/branches`)
export class RepositoryBranches {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `브랜치 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `브랜치 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id`)
export class RepositoryBranch {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `브랜치 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `브랜치 불러오기 성공`;
            response.data = result[0][0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/directory`)
export class RepositoryBranchDirectory {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `디렉터리 불러오기 실패` };
        const result = await mysql.execute(`SELECT RB.*, U.user_email FROM repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.repo_id = ? AND RB.node_id = ?`, [req.params.repo_id, req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { user_email: string; repo_id: number; branch_name: string; node_id: number; };

            response.status = 200;
            response.message = `디렉터리 불러오기 성공`;
            response.data = [];

            const lastCommit = await mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R JOIN users AS U ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id AND R.user_email = U.user_email WHERE RB.node_id = ? ORDER BY RB.created_at DESC LIMIT 1`, [data.node_id]);
            
            if (lastCommit && Array.isArray(lastCommit[0]) && lastCommit[0][0]) {
                const commit = lastCommit[0][0] as { commit_src: string; };

                response.data = await recursion(`${commit.commit_src}`);
                response.data.sort((a: { type: string; }, b: { type: string; }) => {
                    if (a.type === `folder` && b.type !== `folder`) return -1;
                    else if (a.type !== `folder` && b.type === `folder`) return 1;
                    else return 0;
                });
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:node_id/commits`)
export class RepositoryBranchCommits {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `커밋 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT RBC.* FROM repository_branch_commit AS RBC JOIN repository_branch AS RB JOIN repositories AS R ON RBC.branch_id = RB.node_id AND RB.repo_id = R.node_id WHERE RB.node_id = ? AND R.node_id = ? ORDER BY RBC.created_at DESC`, [req.params.node_id, req.params.repo_id]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `커밋 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id`)
export class RepositoryBranchCommit {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `커밋 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `커밋 불러오기 성공`;
            response.data = result[0][0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory`)
export class RepositoryBranchCommitDirectory {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `디렉터리 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE node_id = ?`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            const commit = result[0][0] as { commit_src: string; };

            response.status = 200;
            response.message = `디렉터리 불러오기 성공`;
    
            response.data = await recursion(`${commit.commit_src}`);
            response.data.sort((a: { type: string; }, b: { type: string; }) => {
                if (a.type === `folder` && b.type !== `folder`) return -1;
                else if (a.type !== `folder` && b.type === `folder`) return 1;
                else return 0;
            });
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/branch/:branch_id/commit/:node_id/directory/prev`)
export class RepositoryBranchPrevCommitDirectory {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `디렉터리 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_branch_commit WHERE branch_id = ? AND node_id < ? ORDER BY created_at DESC LIMIT 1`, [req.params.branch_id, Number(req.params.node_id)]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            const commit = result[0][0] as { commit_src: string; };

            response.status = 200;
            response.message = `디렉터리 불러오기 성공`;
    
            response.data = await recursion(`${commit.commit_src}`);
            response.data.sort((a: { type: string; }, b: { type: string; }) => {
                if (a.type === `folder` && b.type !== `folder`) return -1;
                else if (a.type !== `folder` && b.type === `folder`) return 1;
                else return 0;
            });
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:node_id/issues`)
export class RepositoryIssues {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `이슈 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id`)
export class RepositoryIssue {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_issue WHERE repo_id = ? AND node_id = ?`, [req.params.repo_id, req.params.node_id]);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `이슈 불러오기 성공`;
            response.data = result[0][0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/issue/:node_id/comments`)
export class RepositoryIssueComments {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 댓글 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT U.user_email, U.avatar_src, U.user_name, RIC.*, (SELECT user_email FROM repository_issue_comment AS RIC2 WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_email, (SELECT U.user_name FROM repository_issue_comment AS RIC2 JOIN users AS U ON U.user_email = RIC2.user_email WHERE RIC2.node_id = RIC.comment_target_id) AS ric_user_name FROM repository_issue_comment AS RIC JOIN users AS U ON RIC.user_email = U.user_email WHERE RIC.issue_id = ? ORDER BY RIC.created_at ASC`, [req.params.node_id]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `이슈 댓글 목록 불러오기 성공`;
            response.data = [];

            const hearts = await mysql.execute(`SELECT RICH.*, RIC.issue_id FROM repository_issue_comment_heart AS RICH JOIN repository_issue_comment AS RIC ON RICH.comment_id = RIC.node_id WHERE RIC.issue_id = ?`, [req.params.node_id]);

            result[0].forEach(async (e: any) => {
                if (hearts && Array.isArray(hearts[0]) && hearts[0].find((i: any) => i.comment_id === e.node_id)) response.data.push({ ...e, hearts: hearts[0].filter((i: any) => i.comment_id === e.node_id) });
                else response.data.push({ ...e, hearts: [] });
            });
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:node_id/issue/create`)
export class RepositoryIssueCreate {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 작성 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            const insert = await mysql.execute(`INSERT INTO repository_issue (repo_id, user_email, issue_title, issue_content, issue_status) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.issue_title, req.body.issue_content, `대기`]);
            await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, CONCAT(?, "/", RI.node_id), CONCAT("새 이슈: @", IFNULL(U.user_name, R.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U JOIN repository_issue AS RI ON R.user_email = U.user_email AND R.node_id = RI.repo_id WHERE R.node_id = ? ORDER BY RI.created_at DESC LIMIT 1`, [0, `/repositories/${req.params.node_id}/issues`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 이슈를 생성했습니다.`, req.params.node_id]);
            
            if (insert) {
                response.status = 200;
                response.message = `이슈 작성 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/comment/create`)
export class RepositoryIssueCommentCreate {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 댓글 작성 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            const insert = await mysql.execute(`INSERT INTO repository_issue_comment (issue_id, user_email, comment_content, comment_type, comment_target_id) VALUES (?, ?, ?, ?, ?)`, [req.params.node_id, verify.data.data.user_email, req.body.comment_content, req.body.reply ? `reply` : `default`, req.body.reply || null]);
            await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 댓글: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 이슈에 댓글을 달았습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.node_id]);
            
            if (insert) {
                response.status = 200;
                response.message = `이슈 댓글 작성 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/status`)
export class RepositoryIssueStatus {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `상태 변경 실패` };
        const verify: any = await getVerify(req);
        
        if (verify.data.status === 200) {
            const grantes: any = getGrantes(req);

            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email)) {
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RI.user_email, 0, ?, CONCAT("상태 변경: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT("이슈 상태가 \`", RI.issue_status, "\` 에서 \`", ?, "\` (으)로 변경되었습니다.") FROM repositories AS R JOIN users AS R_U JOIN repository_issue AS RI ON R.user_email = R_U.user_email AND RI.repo_id = R.node_id WHERE RI.node_id = ?`, [`/repositories/${req.params.repo_id}/issues/${req.params.node_id}`, req.body.status, req.params.node_id]);
                const update = await mysql.execute(`UPDATE repository_issue SET issue_status = ? WHERE node_id = ?`, [req.body.status, req.params.node_id]);
                
                if (update) {
                    response.status = 200;
                    response.message = `상태 변경 성공`;
                }
            }
        }

        res.send(JSON.stringify(response));
    }
}


@Control.Service(`post`, `/api/repository/create`)
export class RepositoryCreate {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 생성 실패` };
        const verify: any = await getVerify(req);

        if (verify.data.status === 200) {
            const result = await mysql.execute(`SELECT node_id FROM repositories ORDER BY created_at DESC LIMIT 1`);
            const data = { node_id: 0 };
    
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const res = result[0][0] as { node_id: number; };
                data.node_id = res.node_id;
            }
    
            const grantes = JSON.parse(req.body.repo_grantes);
            if (!grantes.reduce((pre: string[], cur: any) => [...pre, cur.user_email], []).includes(verify.data.data.user_email)) await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, `admin`, verify.data.data.user_email]);
            grantes.forEach(async (e: { user_email: string; type: string }) => {
                await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, e.type, e.user_email]);
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("새 권한: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]);
            });
    
            const branch_src: string = `data/${req.body.user_email}/${data.node_id + 1}/main`;
    
            const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
            let id: number = 1;
    
            if (lastId && Array.isArray(lastId[0]) && lastId[0][0]) id = (lastId[0][0] as { node_id: number; }).node_id + 1;
    
            await bucket.upload(`## ${req.body.repo_name}`, `${branch_src}/${id}/readme.md`);
            const branch: any = await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [data.node_id + 1, `main`, branch_src ]);
            await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [branch[0].insertId, `${branch_src}/${id}`, `main branch initial`]);
    
            let path: string = ``;
            if (name) path = `${process.env.PUBLIC_URL}/${name.key}`;
            const insert = await mysql.execute(`INSERT INTO repositories (node_id, user_email, repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, image_src) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [data.node_id + 1, req.body.user_email, req.body.repo_name, req.body.description, req.body.repo_category, req.body.repo_subcategory, req.body.repo_visibility, req.body.repo_archive, req.body.repo_license, path ]);
            grantes.forEach(async (e: { user_email: string; type: string }) => await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]));
    
            if (insert) {
                response.status = 200;
                response.message = `레포지토리 생성 성공`;
            }
        }
    
        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/modify`)
export class RepositoryModify {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 수정 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.body.node_id]);
        const verify: any = await getVerify(req);
        
        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { user_email: string; }
            const grantes: any = { data: await RepositoryGrantes.service({ params: { node_id: req.body.node_id } } as any, { send: () => {}, setHeader: () => {} } as any) };

            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                let update;
                let path: string = ``;
                if (name) path = `${process.env.PUBLIC_URL}/${name.key}`;
                
                const { repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id } = req.body;
                if (path === ``) update = await mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, node_id]);
                else update = await mysql.execute(`UPDATE repositories SET repo_name = ?, repo_description = ?, repo_category = ?, repo_subcategory = ?, repo_visibility = ?, repo_archive = ?, repo_license = ?, image_src = ? WHERE node_id = ?`, [repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, path, node_id]);

                await mysql.execute(`DELETE FROM repository_authorities WHERE repo_id = ?`, [node_id]);
                JSON.parse(req.body.repo_grantes).forEach(async (e: { user_email: string; type: string }) => {
                    await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [node_id, e.type, e.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${req.body.node_id}`, req.body.node_id]);
                });

                if (update) {
                    response.status = 200;
                    response.message = `레포지토리 수정 성공`;
                }
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/fork`)
export class RepositoryFork {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 포크 실패` };
        const verify: any = await getVerify(req);

        if (verify.data.status === 200) {
            const result = await mysql.execute(`SELECT node_id FROM repositories ORDER BY created_at DESC LIMIT 1`);
            const data = { node_id: 0 };
    
            if (result && Array.isArray(result[0]) && result[0][0]) {
                const res = result[0][0] as { node_id: number; };
                data.node_id = res.node_id;
            }
    
            const grantes = JSON.parse(req.body.repo_grantes);
            if (!grantes.reduce((pre: string[], cur: any) => [...pre, cur.user_email], []).includes(verify.data.data.user_email)) await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, `admin`, verify.data.data.user_email]);
            grantes.forEach(async (e: { user_email: string; type: string }) => {
                await mysql.execute(`INSERT INTO repository_authorities (repo_id, authority_type, target_email) VALUES (?, ?, ?)`, [data.node_id + 1, e.type, e.user_email]);
                await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("새 권한: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]);
            });
    
            const branch_src: string = `data/${req.body.user_email}/${data.node_id + 1}/main`;
    
            const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
            let id: number = 1;
    
            if (lastId && Array.isArray(lastId[0]) && lastId[0][0]) id = (lastId[0][0] as { node_id: number; }).node_id + 1;

            await bucket.upload(`## ${req.body.repo_name}`, `${branch_src}/${id}/readme.md`);
            const branch: any = await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [data.node_id + 1, `main`, branch_src ]);
            await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [branch[0].insertId, `${branch_src}/${id}`, `main branch initial`]);
    
            let path: string = ``;
            if (name) path = `${process.env.PUBLIC_URL}/${name.key}`;
            const insert = await mysql.execute(`INSERT INTO repositories (node_id, repo_type, user_email, repo_name, repo_description, repo_category, repo_subcategory, repo_visibility, repo_archive, repo_license, image_src) VALUES (?, "forked", ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [data.node_id + 1, req.body.user_email, req.body.repo_name, req.body.repo_description, req.body.repo_category, req.body.repo_subcategory, req.body.repo_visibility, req.body.repo_archive, req.body.repo_license, path ]);
            grantes.forEach(async (e: { user_email: string; type: string }) => await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT ?, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), "레포지토리에 대한 권한이 부여되었습니다." FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [e.user_email, `/repositories/${data.node_id + 1}`, data.node_id + 1]));
    
            if (insert) {
                response.status = 200;
                response.message = `레포지토리 포크 성공`;
            }
        }
    
        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:node_id/push`)
export class RepositoryBranchPush {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `커밋 일괄처리 실패` };

        const repositoryResult = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (repositoryResult && Array.isArray(repositoryResult[0]) && repositoryResult[0][0]) {
            const data = repositoryResult[0][0] as { user_email: string; };
            const grantes: any = { data: await RepositoryGrantes.service({ params: { node_id: req.params.node_id } } as any, { send: () => {}, setHeader: () => {} } as any) };
            
            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email)) {
                const result = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);
        
                if (result && Array.isArray(result[0])) {
                    if (result[0].length === 0) {
                        const branch_src: string = `data/${verify.data.data.user_email}/${req.params.node_id}/${req.body.branch}`;
                        await mysql.execute(`INSERT INTO repository_branch (repo_id, branch_name, branch_src) VALUES (?, ?, ?)`, [req.params.node_id, req.body.branch, branch_src ]);
                    }

                    const reResult = await mysql.execute(`SELECT * FROM repository_branch WHERE repo_id = ? AND branch_name = ?`, [req.params.node_id, req.body.branch]);

                    if (reResult && Array.isArray(reResult[0]) && reResult[0][0]) {
                        const data = reResult[0][0] as { node_id: number; branch_src: string; };
                        
                        const lastId = await mysql.execute(`SELECT RBC.node_id FROM repository_branch_commit AS RBC JOIN repository_branch AS RB ON RBC.branch_id = RB.node_id WHERE RBC.branch_id = ? AND RB.repo_id = ? ORDER BY RBC.created_at DESC LIMIT 1`, [data.node_id, req.params.node_id]);
                        let id: number = 1;
                        
                        if (lastId && Array.isArray(lastId[0]) && lastId[0][0]) id = (lastId[0][0] as { node_id: number; }).node_id + 1;
                        else {
                            const lastId = await mysql.execute(`SELECT node_id FROM repository_branch_commit ORDER BY created_at DESC LIMIT 1`);
                            if (lastId && Array.isArray(lastId[0]) && lastId[0][0]) id = (lastId[0][0] as { node_id: number; }).node_id + 1;
                        }
                        
                        const recursionSecond = async (path: string) => {
                            const recursionResult = await recursion(path);
                            
                            if (id - 1 > 0 && recursionResult.length > 0) {
                                for (let i = 0; i < recursionResult.length; i++) {
                                    if (recursionResult[i].type === `file`) {
                                        const response = await (await fetch(recursionResult[i].public)).text();
                                        await bucket.uploadStream(response, `${data.branch_src}/${id}/${recursionResult[i].name}`);
                                        
                                    } else {
                                        console.log(`${data.branch_src}/${id}/${recursionResult[i].name}`);
                                        await recursionSecond(`${data.branch_src}/${id}/${recursionResult[i].name}`);
                                    }
                                }
                            }
                        }
                        const path: string = `${data.branch_src}/${id - 1}`;
                        await recursionSecond(path);

                        const newPath: string = `${data.branch_src}/${id}`;
                        
                        req.body.commits.forEach(async (e: { type: string; name: string; file: string; }) => {
                            if (e.type === `add`) {
                                if (await bucket.objectExists(`${newPath}/${e.name}`)) {
                                    await bucket.deleteObject(`${newPath}/${e.name}`);
                                }
                                
                                if (e.file) await bucket.upload(e.file, `${newPath}/${e.name}`);
                                else await bucket.upload(``, `${newPath}/${e.name}`);

                            } else if (e.type === `remove`) {
                                if (await bucket.objectExists(`${newPath}/${e.name}`)) await bucket.deleteObject(`${newPath}/${e.name}`);
                            }
                        });

                        const insert = await mysql.execute(`INSERT INTO repository_branch_commit (branch_id, commit_src, commit_message) VALUES (?, ?, ?)`, [data.node_id, newPath, req.body.message || `메시지 없음`]);
                        await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RA.target_email, 0, ?, CONCAT("@", IFNULL(U.user_name, U.user_email), "/", R.repo_name), CONCAT("\`", ?, "\` 브랜치에 커밋 일괄처리가 되었습니다.") FROM repositories AS R JOIN users U JOIN repository_authorities AS RA ON R.user_email = U.user_email AND RA.repo_id = R.node_id WHERE R.node_id = ?`, [`/repositories/${req.params.node_id}`, req.body.branch, req.params.node_id]);

                        let description = (repositoryResult[0][0] as any).repo_description?.trim() || ``;
                        if (!description) {
                            const chat = await client.chat.completions.create({
                                model: `gpt-4o-mini`,
                                temperature: .7,
                                max_tokens: 48,
                                top_p: 1,
                                messages: [
                                    { role: `system`, content: `코드를 훑어보고 어떤 목적으로 작성한건지 단 한줄 이내의 완벽히 간략한 설명을 작성해야해.\n모든 불필요한 말과 마침표를 제외해줘.\n예시) 제 2의 클라우드 컴퓨팅 겸 레포지토리 호스팅 서비스` },
                                    { role: `user`, content: req.body.commits.reduce((pre: any, cur: any) => [...pre, `\`\`\`\n${cur.file}\n\`\`\``], []).join(`\n\n`) },
                                ],
                            });
                            description = chat.choices[0].message.content;
                        }

                        await mysql.execute(`UPDATE repositories SET repo_description = ? WHERE node_id = ?`, [description, req.params.node_id])
            
                        if (insert) {
                            response.status = 200;
                            response.message = `커밋 일괄처리 성공`;
                        }
                    }
                }
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:node_id/pullrequests`)
export class RepositoryPullRequests {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `풀리퀘스트 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_pullrequest WHERE target_repo_id = ? ORDER BY created_at DESC`, [req.params.node_id]);

        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `풀리퀘스트 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/repository/:repo_id/pullrequest/:node_id`)
export class RepositoryPullRequest {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `풀리퀘스트 불러오기 실패` };
        const result = await mysql.execute(`SELECT * FROM repository_pullrequest WHERE node_id = ? ORDER BY created_at DESC`, [req.params.node_id]);

        if (result && Array.isArray(result[0]) && result[0][0]) {
            response.status = 200;
            response.message = `풀리퀘스트 불러오기 성공`;
            response.data = result[0][0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:node_id/pullrequest/create`)
export class RepositoryPullRequestCreate {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `풀리퀘스트 전송 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);
        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (result && Array.isArray(result[0]) && result[0][0] && verify.data.status === 200) {
            await mysql.execute(`INSERT INTO repository_pullrequest (repo_id, target_repo_id, user_email, pr_type, branch_name, target_branch_name, commit_id, pr_title, pr_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.repo_id, req.body.target_repo_id, verify.data.data.user_email, `대기`, req.body.branch_name, req.body.target_branch_name, req.body.commit_id, req.body.pr_title, req.body.pr_content]);

            response.status = 200;
            response.message = `풀리퀘스트 전송 성공`;
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/branch/:node_id/remove`)
export class RepositoryBranchRemove {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `브랜치 삭제 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
        const branch = await mysql.execute(`SELECT * FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);

        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (result && Array.isArray(result[0]) && result[0][0] && branch && Array.isArray(branch[0]) && branch[0][0]) {
            const data = result[0][0] as { user_email: string; };
            const grantes: any = getGrantes(req);
            
            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                await mysql.execute(`DELETE FROM repository_branch WHERE node_id = ?`, [req.params.node_id]);
                await mysql.execute(`DELETE FROM repository_branch_commit WHERE branch_id = ?`, [req.params.node_id]);
                await bucket.deleteObject(`/data/${data.user_email}/${req.params.repo_id}/${(branch[0][0] as any).branch_name}`);

                response.status = 200;
                response.message = `브랜치 삭제 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:node_id/remove`)
export class RepositoryRemove {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `레포지토리 삭제 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.node_id]);

        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { user_email: string; };
            const grantes: any = { data: await RepositoryGrantes.service({ params: { node_id: req.params.node_id } } as any, { send: () => {}, setHeader: () => {} } as any) };
            
            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                await mysql.execute(`DELETE FROM repositories WHERE node_id = ?`, [req.params.node_id]);
                await mysql.execute(`DELETE FROM repository_branch WHERE repo_id = ?`, [req.params.node_id]);
                await mysql.execute(`DELETE FROM repository_authorities WHERE repo_id = ?`, [req.params.node_id]);
                await bucket.deleteObject(`/data/${data.user_email}/${req.params.node_id}`);

                response.status = 200;
                response.message = `레포지토리 삭제 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/issue/:node_id/remove`)
export class RepositoryIssueRemove {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `이슈 삭제 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { user_email: string; };
            const grantes: any = getGrantes(req);
            
            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                await mysql.execute(`DELETE FROM repository_issue WHERE node_id = ?`, [req.params.node_id]);

                response.status = 200;
                response.message = `이슈 삭제 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/issue/:issue_id/comments/:node_id/remove`)
export class RepositoryIssueCommentRemove {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `댓글 삭제 실패` };

        const result = await mysql.execute(`SELECT * FROM repositories WHERE node_id = ?`, [req.params.repo_id]);
        const verify: any = { data: await OauthVerify.service({ body: { accessToken: req.body.accessToken, agent: true }, headers: { "user-agent": req.headers[`user-agent`] } } as any, { send: () => {}, setHeader: () => {} } as any) };

        if (result && Array.isArray(result[0]) && result[0][0]) {
            const data = result[0][0] as { user_email: string; };
            const grantes: any = getGrantes(req);
            
            if (grantes.data.data.find((e: any) => e.target_email === verify.data.data.user_email && e.authority_type === `admin`)) {
                await mysql.execute(`DELETE FROM repository_issue_comment WHERE node_id = ?`, [req.params.node_id]);
                await mysql.execute(`DELETE FROM repository_issue_comment_heart WHERE comment_id = ?`, [req.params.node_id]);

                response.status = 200;
                response.message = `댓글 삭제 성공`;
            }
        }

        res.send(JSON.stringify(response));
    }
}


@Control.Service(`get`, `/api/repository/:node_id/stars`)
export class RepositoryStars {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `스타 목록 불러오기 실패` };

        const result = await mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ?`, [req.params.node_id]);

        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `스타 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:node_id/star`)
export class RepositoryStar {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `스타 실패` };
        const verify: any = await getVerify(req);

        if (verify.data.status === 200) {
            const result = await mysql.execute(`SELECT * FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);

            if (result && Array.isArray(result[0])) {
                if (result[0][0]) await mysql.execute(`DELETE FROM repository_star WHERE repo_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                else {
                    await mysql.execute(`INSERT INTO repository_star (repo_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT U.user_email, ?, ?, CONCAT("새 스타: @", IFNULL(U.user_name, U.user_email), "/", R.repo_name), ? AS user_email FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE R.node_id = ?`, [0, `/repositories/${req.params.node_id}`, `${verify.data.data.user_name || verify.data.data.user_email}님이 당신의 레포지토리에 스타를 남겼습니다.`, req.params.node_id]);
                }
            }
            
            response.status = 200;
            response.message = `스타 성공`;
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`post`, `/api/repository/:repo_id/issue/:issue_id/comment/:node_id/heart`)
export class RepositoryIssueCommentHeart {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `하트 실패` };
        const verify: any = await getVerify(req);

        if (verify.data.status === 200) {
            const result = await mysql.execute(`SELECT * FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);

            if (result && Array.isArray(result[0])) {
                if (result[0][0]) await mysql.execute(`DELETE FROM repository_issue_comment_heart WHERE comment_id = ? AND user_email = ?`, [req.params.node_id, verify.data.data.user_email]);
                else {
                    await mysql.execute(`INSERT INTO repository_issue_comment_heart (comment_id, user_email) VALUES (?, ?)`, [req.params.node_id, verify.data.data.user_email]);
                    await mysql.execute(`INSERT INTO user_alert (user_email, alert_read, alert_link, alert_title, alert_content) SELECT RIC.user_email, 0, CONCAT("/repositories/", R.node_id, "/issues/", RI.node_id), CONCAT("새 하트: @", IFNULL(R_U.user_name, R_U.user_email), "/", R.repo_name, " [", RI.issue_title, "]"), CONCAT(?, "님이 당신의 댓글에 하트를 남겼습니다.") FROM repositories AS R JOIN repository_issue AS RI JOIN repository_issue_comment AS RIC JOIN users AS RI_U JOIN users AS R_U ON R.node_id = RI.repo_id AND RI.node_id = RIC.issue_id AND R_U.user_email = R.user_email AND RI_U.user_email = RI.user_email WHERE RI.node_id = ? AND RIC.node_id = ? ORDER BY RIC.created_at DESC LIMIT 1`, [verify.data.data.user_name || verify.data.data.user_email, req.params.issue_id, req.params.node_id]);
                }
            }
            
            response.status = 200;
            response.message = `하트 성공`;
        }

        res.send(JSON.stringify(response));
    }
}


@Control.Service(`get`, `/api/topics/:category`)
export class Topics {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `토픽 목록 불러오기 실패` };

        let result;
        if (req.params.category === `all`) result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 ORDER BY R.created_at DESC LIMIT 100`);
        else result = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE repo_archive = 0 AND repo_visibility = 1 AND repo_category = ? ORDER BY R.created_at DESC LIMIT 100`, [req.params.category]);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `토픽 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}

@Control.Service(`get`, `/api/categories`)
export class Categories {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `카테고리 목록 불러오기 실패` };
        const result = await mysql.execute(`SELECT DISTINCT repo_category FROM repositories ORDER BY created_at DESC LIMIT 100`);
        
        if (result && Array.isArray(result[0])) {
            response.status = 200;
            response.message = `카테고리 목록 불러오기 성공`;
            response.data = result[0];
        }

        res.send(JSON.stringify(response));
    }
}


@Control.Service(`get`, `/api/search`)
export class Search {
    public static async service(req: Request, res: Response, name?: any): Promise<void> {
        res.setHeader(`Content-type`, `application/json`);

        const response: Status = { status: 400, message: `검색 실패` };
        const resultRepos = await mysql.execute(`SELECT R.*, U.user_name FROM repositories AS R JOIN users AS U ON R.user_email = U.user_email WHERE (R.repo_name LIKE CONCAT("%", ?, "%") OR R.repo_category LIKE CONCAT("%", ?, "%") OR R.repo_subcategory LIKE CONCAT("%", ?, "%")) AND repo_archive = 0 AND repo_visibility = 1`, [req.query.q, req.query.q, req.query.q]);
        const resultUsers = await mysql.execute(`SELECT user_name, user_email, avatar_src, user_bio FROM users WHERE user_name LIKE CONCAT("%", ?, "%") OR user_email LIKE CONCAT("%", ?, "%")`, [req.query.q, req.query.q]);
        
        if (resultRepos && Array.isArray(resultRepos[0]) && resultUsers && Array.isArray(resultUsers[0])) {
            response.status = 200;
            response.message = `검색 성공`;
            response.data = {};
            response.data.repositories = resultRepos[0];
            response.data.users = resultUsers[0];
        }

        res.send(JSON.stringify(response));
    }
}

Control.setRoutes(r2.r2);
Control.spawnListen();