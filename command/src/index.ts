/* eslint-disable @typescript-eslint/no-explicit-any */

import { exec } from 'child_process';
import { program } from 'commander';
import FormData from 'form-data';
import axios from 'axios';
import c from 'chalk';
import fs from 'fs';

const path = `.inf`;

const print = (type: string, e: string) => {
    if (type === 'red') console.log();
    
    console.log(c`{grey [}{${type} #}{grey ]} ${e}`);

    if (type === 'red') {
        console.log(c` {red ^ ${'-'.repeat(e.length + 2)}}`);
        console.log(c` {red 400: response error}\n`);
    }
};

const access = (path: string) => new Promise(r => fs.access(path, fs.constants.F_OK, e => r(!e)));

const verify = async () => {
    if (await access(`${path}/token.key`)) {
        const token = await fs.promises.readFile(`${path}/token.key`, 'utf-8');
        const response = await (await fetch('http://localhost:8080/oauth/token/verify', { headers: { Authorization: `Bearer ${token}` } })).json();

        if (response.status === 400) {
            print('red', c`the session has expired or does not exist`);
            return false;
        }

        print('yellow', c`{grey ${response.data.user_email}}`);
        return response.data;
    }

    print('red', c`the {cyan token.key} file does not exist`);
    return false;
};

program.command('init')
.action(async () => {
    if (await access(path)) {
        print('red', c`folder {cyan .inf} already exists`);
        return;
    }

    await fs.promises.mkdir(path, { recursive: true });

    if (process.platform === 'darwin') {
        exec(`chflags hidden ${path}`, () => {
            print('green', c`successful created folder {cyan .inf}`);
        });

    } else if (process.platform === 'win32') {
        exec(`attrib +h ${path}`, () => {
            print('green', c`successful created folder {cyan .inf}`);
        });

    } else {
        print('red', c`this feature is not supported on {cyan ${process.platform}}`);
    }
});

program.command('signin')
    .argument('<string>', 'access token')
.action(async (str) => {
    const response = await (await fetch('http://localhost:8080/oauth/token/verify', { headers: { Authorization: `Bearer ${str}` } })).json();

    if (response.status === 400) {
        print('red', c`this is a non-existent user`);
        return;
    }

    await fs.promises.writeFile(`${path}/token.key`, str);
    print('green', c`signin successful: {cyan ${response.data.user_name}}`);
});

program.command('repo')
    .argument('<string>', 'repository name')
    .option('--desc <string>', 'repository description', '')
    .option('-N, --no-branch', 'no branch option')
.action(async (name, options) => {
    const token = await fs.promises.readFile(`${path}/token.key`, 'utf-8');
    const exists = await verify();

    if (exists) {
        const response = await (await fetch('http://localhost:8080/repository/create', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                repo_name: name,
                repo_description: options.desc,
                repo_license: 'mit',
                no_branch: options.branch
            })
        })).json();

        if (response.status === 200) print('green', c`create successful: {cyan ${name}}`);
        else print('red', c`${response.message}`);
    }
});

program.command('origin')
    .argument('<string>', 'repository name')
.action(async (str) => {
    const exists = await verify();

    if (exists) {
        await fs.promises.writeFile(`${path}/repo.key`, str);
        print('green', c`successful created origin {cyan @${exists.user_name}/${str}}`);
    }
});

program.command('branch')
    .argument('<string>', 'branch name')
    .option('--desc <string>', 'branch description', '')
.action(async (name, options) => {
    const token = await fs.promises.readFile(`${path}/token.key`, 'utf-8');
    const repo_name = await fs.promises.readFile(`${path}/repo.key`, 'utf-8');

    const exists = await verify();

    if (exists) {
        const response = await (await fetch('http://localhost:8080/branch/create', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                repo_name,
                branch_name: name,
                repo_description: options.desc,
            })
        })).json();

        if (response.status === 200) print('green', c`create successful: {green @${exists.user_name}} {grey ${repo_name}}/{cyan ${name}}`);
        else print('red', c`${response.message}`);
    }
});

const recursively = async (dirPath: string, data: string[]) => {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        const stat = await fs.promises.stat(fullPath);

        if (stat.isDirectory()) await recursively(fullPath, data);
        else {
            if (!data.includes(fullPath)) {
                data.push(fullPath);
                print('green', c`added to the workspace: {cyan ${fullPath}}`);
                
            } else print('yellow', c`{cyan ${fullPath}} => {grey no action}`);
        }
    }
};

program.command('add')
    .argument('<string>', 'file path')
.action(async (name) => {
    let data: any = { added: [], commit: [] };
    if (await access(`${path}/dir.json`)) data = JSON.parse(await fs.promises.readFile(`${path}/dir.json`) as any);
    
    if (!(await access(name))) {
        print('red', c`the file or directory {cyan ${name}} does not exist`);
        return;
    }

    const stat = await fs.promises.stat(name);
    if (stat.isDirectory()) await recursively(name, data.added);
    else {
        if (data.added.includes(name)) print('yellow', c`{cyan ${name}} => {grey no action}`);
        else {
            data.added.push(name);
            print('green', c`added to the workspace: {cyan ${name}}`);
        }
    }

    await fs.promises.writeFile(`${path}/dir.json`, JSON.stringify(data, null, 4));
});

program.command('commit')
    .argument('<string>', 'commit description')
.action(async (str) => {
    if (!(await access(`${path}/dir.json`))) {
        print('red', c`the workspace {cyan ${path}/dir.json} does not exist`);
        return;
    }

    const data = JSON.parse(await fs.promises.readFile(`${path}/dir.json`) as any);
    data.commit.push({ description: str, added: data.added });
    data.added = [];

    await fs.promises.writeFile(`${path}/dir.json`, JSON.stringify(data, null, 4));
});

program.command('push')
    .argument('<string>', 'branch name')
.action(async (branchName) => {
    const repo_name = await fs.promises.readFile(`${path}/repo.key`, 'utf-8');

    if (!(await access(`${path}/dir.json`))) {
        print('red', c`the workspace {cyan ${path}/dir.json} does not exist`);
        return;
    }

    const data = JSON.parse(await fs.promises.readFile(`${path}/dir.json`) as any);

    let allPaths: string[] = [];
    for (const commitEntry of data.commit) {
        if (commitEntry.added && Array.isArray(commitEntry.added)) {
            allPaths = allPaths.concat(commitEntry.added);
        }
    }

    const buildStructure = (paths: string[]): any[] => {
        const structure: Record<string, any> = {};

        for (const p of paths) {
            const parts = p.split('/');
            let current = structure;
            for (let i = 0; i < parts.length; i++) {
                const name = parts[i];
                if (!current[name]) current[name] = { children: {}, isFile: false, fullPath: '' };

                const isLast = i === parts.length - 1;
                if (isLast) {
                    const stat = fs.statSync(p);
                    current[name].isFile = stat.isFile();
                    current[name].fullPath = p;
                }

                current = current[name].children;
            }
        }

        const convert = (node: Record<string, any>): any[] => {
            return Object.keys(node).map(key => {
                const entry = node[key];
                if (entry.isFile) {
                    const buffer = fs.readFileSync(entry.fullPath);
                    return {
                        type: 'file',
                        name: key,
                        fullPath: entry.fullPath,
                        buffer
                    };
                } else {
                    return {
                        type: 'folder',
                        name: key,
                        child: convert(entry.children)
                    };
                }
            });
        };

        return convert(structure);
    };

    const form = new FormData();
    form.append('commit_descriptions', JSON.stringify(data.commit));

    data.commit = buildStructure(allPaths);
    data.added = [];

    const token = await fs.promises.readFile(`${path}/token.key`, 'utf-8');
    const exists = await verify();
    if (!exists) return;

    form.append('repo_name', repo_name);
    form.append('branch_name', branchName);

    const files: { origin: string; insert: string }[] = [];
    const appendFiles = (items: any[], parentPath = '') => {
        for (const item of items) {
            if (item.type === 'file') {
                const newFileName = `${new Date().getTime()}-${item.name}`;
                const filePath = parentPath ? `${parentPath}/${newFileName}` : newFileName;
                form.append('files', item.buffer, { filename: filePath });
                files.push({ insert: newFileName, origin: `${parentPath ? `${parentPath}/` : ''}${item.name}` });
            } else if (item.type === 'folder') {
                appendFiles(item.child, parentPath ? `${parentPath}/${item.name}` : item.name);
            }
        }
    };

    appendFiles(data.commit);
    form.append('origin', JSON.stringify(files));

    const response = await axios.post('http://localhost:8080/branch/push', form, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            ...form.getHeaders()
        }
    });

    if (response.data.status === 200) {
        print('green', c`push successful: {green @${exists.user_name}} {grey ${repo_name}}/{cyan ${branchName}} => {yellow ${response.data.data.uuid}}`);

        data.commit = [];
        await fs.promises.writeFile(`${path}/dir.json`, JSON.stringify(data, null, 4));
        
    } else print('red', c`${response.data.message}`);
});

program.parse();
