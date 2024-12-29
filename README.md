# 🎬 inf, hubof.

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![nextjs](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![express](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![chatgpt](https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white)

[Hompage](https://kithub-inc.com) (under-development) / [Notion](https://ice1.notion.site/inf-hubof-115cac11afd48039b8ccd22d04cb257f?pvs=4)

/ **손쉽게 CI/CD 파이프라인을 구축하고, 새로운 서비스를 만드세요!**<br>
Build a CI/CD pipeline with ease, and create new services!

/ 인프는 사용자 규격을 맞추었습니다.<br>
/ 블럭코딩을 통해 이벤트를 만들고, 원할 때에 실행 시킬 수 있죠.<br>
Inf has customized the user specification. Block coding allows<br>
you to create events and run them whenever you want.

## 🎃 이벤트메이커 Event-maker --,

### -, Statements
- 레포지토리 생성 시: OnRepositoryCreate
- 레포지토리 수정 시: OnRepositoryEdit
- + `repo_id`
- 브랜치 생성 시: OnBranchCreate
- + `repo_id`
- 커밋 시: OnCommit
- + `branch_id`

### -, Apis
- 레포지토리 수정: RepositoryEdit
- + `repo_id`, `repo_name`, `repo_description`
- 패키지 생성: CreatePackage
- + `branch_id`, `package_name`, `package_description`, `package_version`, `package_tag`
- 연동 (도커): Integrate (Docker)

### -, Scripting

/ 이벤트메이커는, 블럭코딩 말고도 직접 스크립팅을 할 수 있습니다!<br>
/ 하지만, 제가 직접 만든 새로운 스크립트 언어를 알아야합니다.<br>
Event makers can also script directly other than block coding!<br>
However, I need to know a new script language that I have created myself.
```ts
function modify() {
    @RepositoryEdit => (
        repo_id: 1,
        repo_description: 'modified'
    );

    print 'the first api call';
}

function package() {
    @CreatePackage => (
        branch_id: 1,
        package_name: 'v1.0',
        package_description: 'version has been created.',
        package_version: '1.0.0',
        package_tag: ['release'],
    );

    print 'the second api call';
}

function app() {
    print 'test log message';

    return #Text => (
        text: 'Hello, world!'
    );
}

export { app, modify, package };
```
/ 꽤 간단합니다. `@` 로 api를 호출하고,<br>
/ `#` 으로 앱의 레이아웃 제작이 가능해집니다.<br>
It's pretty simple. Call the api with '@',<br>
It is possible to create the layout of the app with '#'.

/ 또한 새 컴포넌트를 만드는 일도 가능합니다.<br>
You can also create new components.

```ts
var count: Number = 0;

function Component(name: String) {
    return #Layout => (
        children: [
            #Text => (
                text: 'Hello, ' + name + '!'
            ),
            #Text => (
                text: 'count' + count
            ),
            #Button => (
                text: 'click me',
                click: lambda () => {
                    rep count = count + 1;
                }
            )
        ]
    );
}

function app() {
    return #Component => (
        name: 'ICe1BotMaker'
    );
}
```

/ 간단하게 state 생성도 가능하죠.<br>
It is also possible to easily create a state.

## 🎹 커맨드 Command --,

```
Usage: index [options] [command]

Options:
    -h, --help

Commands:
    init
    signin <string>
    repo [options] <string>
    origin <string>
    branch [options] <string>
    add <string>
    commit <string>
    push <string>
    help [command]
```

### -, Installation

```bash
$ npm install -g @inf-hubof/cli
```

### -, Repository-Options

- --desc [string]
- -N (--no-branch)

### -, Branch-Options

- --desc [string]

### -, Test

```bash
inf init

inf signin "eyJ..."

inf repo test-repo -N
inf origin test-repo

inf branch main

inf add index.js
inf commit "[feat] script"
inf add docs
inf commit "[docs] updated docs"
inf push main

inf add package.json
inf commit "[chore] eslint"
inf push main
```
