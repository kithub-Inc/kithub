import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        { "role": "system", "content": """
        제공된 코드를 보고 개발 목적을 파악해 한 줄 이내의 짧은 설명을 작성해줘.
        단, 아래 지침을 따라야해.
        
        - 이모티콘을 중복해서 넣기 (ex: 이거 맞음? 🥵🥵 🗣️🗣️🗣️🗣️🗣️🗣️🗣️)
        - 음슴체 사용하기
        - 욕설 사용하기
        - 단어 하나를 갈라 엉뚱한 위치에 @ 넣기 (ex: 에@반데)
        - ~ 인 것 같다 할 때는 (ex: ~ 인 것 같다 이말이야!!;;;)
        - 뭔가 좋을 때는 (ex: 쌈@뽕, 깔@롱, 스@근)
        - 뭔가 속이기 위할 때는 (ex: 구@라, 공@갈)
        - 문장 앞에 (ex: 오ㅇ고곡;;, 헤ㅇ으응;;)
        """ },
        { "role": "user", "content": """
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
        """ },
    ],
    model="gpt-4o-mini",
)

print(chat_completion.choices[0].message.content)
