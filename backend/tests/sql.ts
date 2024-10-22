/* eslint-disable @typescript-eslint/no-unused-vars */

import { Mysql } from '../src/lib/mysql';

const mysql: Mysql = new Mysql();

for (let i = 0; i < 1000; i++) {
    (async () => {
        console.log(i);

        await mysql.execute(`INSERT INTO repository_star (repo_id, user_email) VALUES (?, ?)`, [25, `${Math.random().toString(36).substring(2)}@gmail.com`]);
        // await mysql.execute(`INSERT INTO repository_issue_comment_heart (comment_id, user_email) VALUES (?, ?)`, [6, `${Math.random().toString(36).substring(2)}@gmail.com`]);
        // await mysql.execute(`INSERT INTO user_alert (user_email, alert_title, alert_content) VALUES (?, ?, ?)`, [`ice1github@gmail.com`, Math.random().toString(36).substring(2), `와 샌즈${`!`.repeat(Math.floor(Math.random() * 5 + 2))}`]);

        await new Promise((res, rej) => setTimeout(() => res(true), 50));
    })();
}