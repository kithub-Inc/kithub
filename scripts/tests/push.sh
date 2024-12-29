mysql -h localhost -u root -p inf < server/sql/refresh.sql

cd cli/test
unlink ./.inf/dir.json
npx ts-node ../src/index.ts repo test-repo
npx ts-node ../src/index.ts origin test-repo
npx ts-node ../src/index.ts branch main
npx ts-node ../src/index.ts add index.js
npx ts-node ../src/index.ts commit "[feat] 라이센스랑 엄준식"
npx ts-node ../src/index.ts add docs
npx ts-node ../src/index.ts commit "[docs] 문서"
npx ts-node ../src/index.ts push main

npx ts-node ../src/index.ts add package.json
npx ts-node ../src/index.ts commit "[chore] 패키지쩜제이슨"
npx ts-node ../src/index.ts push main
