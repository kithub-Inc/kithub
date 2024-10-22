/* eslint-disable react/no-children-prop */

'use client';

import { FolderIcon, FileJson2Icon, FileImageIcon, FileVideo2Icon, FolderTreeIcon, PencilRulerIcon, DiffIcon, CableIcon, ChevronRight } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import dotenv from 'dotenv';
import path from 'path';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import RepositoryProvider from '@/components/repository-provider';

import { IProps } from '@/interfaces/interfaces';

dotenv.config();

function getMatrix(a: string[], b: string[]) {
    const m = a.length;
    const n = b.length;
    const matrix = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1] + 1;
            else matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
    }

    return matrix;
}

function diff(a: string, b: string) {
    const c = a.split(`\n`);
    const d = b.split(`\n`);
    let i = c.length;
    let j = d.length;

    const result = [];
    const matrix = getMatrix(c, d);

    while (i > 0 && j > 0) {
        if (c[i - 1] === d[j - 1]) {
            result.unshift({ type: 'common', value: c[i - 1] });
            i--; j--;
        } else if (matrix[i - 1][j] >= matrix[i][j - 1]) {
            result.unshift({ type: 'delete', value: c[i - 1] });
            i--;
        } else {
            result.unshift({ type: 'insert', value: d[j - 1] });
            j--;
        }
    }

    while (i > 0) {
        result.unshift({ type: 'delete', value: c[i - 1] });
        i--;
    }

    while (j > 0) {
        result.unshift({ type: 'insert', value: d[j - 1] });
        j--;
    }

    return result;
}

const Child = ({ branch, commit, directory, prevDirectory, readme, viewDirectory, setViewDirectory, fileName, setFileName }: IProps): JSX.Element => {
    const [content, setContent] = useState<string>(``);

    return (
        <div className="max-w-[59rem]">
            {
                commit ?
                <>
                    <div className="mt-10">
                        <Badge variant="secondary">
                            <FolderTreeIcon className="mr-1.5 w-3 h-3" />
                            폴더 및 파일
                        </Badge>
    
                        <div className="mt-5 rounded-xl overflow-hidden border">
                            {
                                branch && directory.length !== viewDirectory.length &&
                                <div>
                                    <div className="px-5 py-3 flex items-center select-none bg-slate-100" onClick={() => setViewDirectory(directory)}>
                                        ~ /
                                    </div>
                                    
                                    <Separator />
                                </div>
                            }
    
                            {
                                viewDirectory.map((e, idx) =>
                                    <div key={idx}>
                                        <div className="hover:bg-slate-100 px-5 py-3 flex items-center select-none" onClick={() => {
                                            if (typeof e.content === `object`) setViewDirectory(e.content);
                                            else if (e.name.endsWith(`.md`)) {
                                                setContent(``);
                                                setFileName(e.name);
                                            } else {
                                                setContent(e.content);
                                                setFileName(e.name);
                                            }
                                        }}>
                                            {
                                                e.type === `folder` ?
                                                <FolderIcon className="w-4 h-4 mr-2 mb-0.5" />
                                                :
                                                (
                                                    [`.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`, `.cr2`, `.nef`, `.arw`, `.dng`, `.raw`, `.rw2`, `.orf`, `.sr2`].includes(path.extname(e.name).toLowerCase()) ?
                                                    <FileImageIcon className="w-4 h-4 mr-2 mb-0.5" />
                                                    :
                                                    (
                                                        [`.mp4`, `.mov`, `.avi`, `.mkv`, `.flv`, `.wmv`, `.webm`, `.mpg`, `.mpeg`].includes(path.extname(e.name).toLowerCase()) ?
                                                        <FileVideo2Icon className="w-4 h-4 mr-2 mb-0.5" />
                                                        :
                                                        <FileJson2Icon className="w-4 h-4 mr-2 mb-0.5" />
                                                    )
                                                )
                                            }
                                            {e.name}
                                        </div>
                                        
                                        <Separator />
                                    </div>
                                )
                            }
                        </div>
                    </div>
    
                    <div className="mt-10">
                        <Badge variant="secondary">
                            <PencilRulerIcon className="mr-1.5 w-3 h-3" />
                            {fileName}
                        </Badge>
    
                        <div className="mt-5 px-5 py-3 rounded-xl overflow-hidden border">
                            {
                                content ?
                                <div className="code2 whitespace-pre-wrap">{content}</div>
                                :
                                <div className="markdown">
                                    <ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
                                        { readme ? readme : `(내용 없음)` }
                                    </ReactMarkdown>
                                </div>
                            }
                        </div>
                    </div>
    
                    <div className="mt-10">
                        <div className="flex">
                            <Badge variant="secondary">
                                <DiffIcon className="mr-1.5 w-3 h-3" />
                                이전 커밋 DIFF
                            </Badge>
                            <Badge className="ml-2" variant="default">beta</Badge>
                        </div>
    
                        {
                            prevDirectory &&
                            directory.map((e, i) =>
                                e.type === `file` && prevDirectory.reduce((pre, cur) => [...pre, cur.name], [`/`]).includes(e.name) &&
                                <div key={i} className="mt-5 rounded-xl overflow-hidden border code">
                                    <div className="px-5 py-3 border border-l-0 border-t-0 border-r-0 bg-slate-100 text-xs flex items-center">
                                        <FileJson2Icon className="w-4 h-4 mr-2 mb-0.5" />
                                        {e.name}
                                    </div>
    
                                    <div className="px-5 py-3">
                                        {
                                            prevDirectory.map(e_ => {
                                                if (e_.name === e.name)
                                                return diff(e_.content, e.content).map((e__, i) =>
                                                    <div key={i} className={`code-${e__.type}`}>
                                                        <span>{e__.value.replace(/ /g, `\u00A0`)}</span>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </>
                :
                <>
                    <div className="block md:flex flex-wrap">
                        <div className="flex items-center mt-10">
                            <div className="rounded-xl overflow-hidden border code h-[255px] overflow-y-scroll">
                                <div className="px-5 py-3 border border-l-0 border-t-0 border-r-0 bg-slate-100 text-xs flex items-center sticky top-0">
                                    <CableIcon className="w-3 h-3 mr-2 mb-0.5" />
                                    <span style={{ wordSpacing: `-3px` }}>kit 설치 및 환경 설정</span>
                                </div>

                                <div className="px-5 py-3 flex flex-col gap-1">
                                    <div className="flex flex-wrap">Node.js가 설치되어있다면</div>
                                    <div className="flex flex-wrap">터미널에 다음과 같이 입력합니다:</div>

                                    <div className="code2 my-1 px-4 py-2 bg-slate-100 rounded-md flex items-center"><div className="text-slate-400 mr-2">$</div> npm install <div className="text-cyan-700 ml-2.5">@ice1/kithub</div></div>
                                    <div className="h-[15px]"></div>

                                    <div className="flex flex-wrap">그 다음 기본 환경 설정을 위해</div>
                                    <div className="flex flex-wrap">터미널에 다음과 같이 입력합니다:</div>

                                    <div className="code2 my-1 px-4 py-2 bg-slate-100 rounded-md flex items-center"><div className="text-slate-400 mr-2">$</div> kit <div className="text-cyan-700 ml-2.5">init</div></div>
                                    <div className="h-[15px]"></div>

                                    <div className="flex flex-wrap">그러면 현재 위치해있는 디렉터리에</div>
                                    <div className="flex flex-wrap"><span className="bg-blue-50 !text-xs mr-2 flex justify-center items-center px-2 py-1 rounded-md text-blue-700">.kithub</span> 라는 이름을 가진 폴더가 추가됩니다.</div>
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 mx-5" />
                        </div>

                        <div className="flex items-center mt-10">
                            <div className="rounded-xl overflow-hidden border code h-[255px] overflow-y-scroll">
                                <div className="px-5 py-3 border border-l-0 border-t-0 border-r-0 bg-slate-100 text-xs flex items-center sticky top-0">
                                    <CableIcon className="w-3 h-3 mr-2 mb-0.5" />
                                    <span style={{ wordSpacing: `-3px` }}>kit 터미널 로그인</span>
                                </div>

                                <div className="px-5 py-3 flex flex-col gap-1">
                                    <div className="flex flex-wrap">
                                        <Breadcrumb className="mr-3">
                                            <BreadcrumbList>
                                                <BreadcrumbItem>프로필</BreadcrumbItem>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>설정</BreadcrumbItem>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>보안</BreadcrumbItem>
                                            </BreadcrumbList>
                                        </Breadcrumb>

                                        탭 에서 액세스 토큰을 찾아 복사한 뒤,
                                    </div>

                                    <div className="flex flex-wrap">
                                        터미널에 다음과 같이 입력합니다:
                                    </div>

                                    <div className="code2 my-1 px-4 py-2 bg-slate-100 rounded-md flex items-center"><div className="text-slate-400 mr-2">$</div> kit signin <div className="text-green-700 ml-2.5">&lt;액세스 토큰&gt;</div></div>
                                    <div className="h-[15px]"></div>

                                    <div className="flex flex-wrap">
                                        그 뒤 로그인에 실패하게 된다면 토큰이 만료된건 아닌지,
                                    </div>

                                    <div className="flex flex-wrap">
                                        무언가 빼먹은건 아닌지 꼼꼼히 확인해주세요.
                                    </div>
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 mx-5" />
                        </div>

                        <div className="flex items-center mt-10">
                            <div className="rounded-xl overflow-hidden border code h-[255px] overflow-y-scroll">
                                <div className="px-5 py-3 border border-l-0 border-t-0 border-r-0 bg-slate-100 text-xs flex items-center sticky top-0">
                                    <CableIcon className="w-3 h-3 mr-2 mb-0.5" />
                                    <span style={{ wordSpacing: `-3px` }}>kit 커밋</span>
                                </div>

                                <div className="px-5 py-3 flex flex-col gap-1">
                                    <div className="flex flex-wrap">로그인을 완료했다면, 프로젝트 루트 경로에서</div>
                                    <div className="flex flex-wrap">터미널에 다음과 같이 입력합니다:</div>

                                    <div className="code2 my-1 px-4 py-2 bg-slate-100 rounded-md flex items-center"><div className="text-slate-400 mr-2">$</div> kit commit <div className="text-green-700 ml-2.5">&lt;파일 이름&gt;</div> <div className="text-orange-700 ml-2.5">&lt;? 커밋 메시지&gt;</div></div>
                                    <div className="h-[15px]"></div>

                                    <div className="flex flex-wrap">그러면 작업 디렉터리에 입력한 파일이</div>
                                    <div className="flex flex-wrap">메시지와 함께 추가됩니다.</div>
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 mx-5" />
                        </div>

                        <div className="flex items-center mt-10">
                            <div className="rounded-xl overflow-hidden border code h-[255px] overflow-y-scroll">
                                <div className="px-5 py-3 border border-l-0 border-t-0 border-r-0 bg-slate-100 text-xs flex items-center sticky top-0">
                                    <CableIcon className="w-3 h-3 mr-2 mb-0.5" />
                                    <span style={{ wordSpacing: `-3px` }}>kit 브랜치 푸쉬</span>
                                </div>

                                <div className="px-5 py-3 flex flex-col gap-1">
                                    <div className="flex flex-wrap">커밋을 진행했다면,</div>
                                    <div className="flex flex-wrap">터미널에 다음과 같이 입력합니다:</div>

                                    <div className="code2 my-1 px-4 py-2 bg-slate-100 rounded-md flex items-center"><div className="text-slate-400 mr-2">$</div> kit push <div className="text-green-700 ml-2.5">&lt;새 브랜치 or 기존 브랜치 이름&gt;</div></div>
                                    <div className="h-[15px]"></div>

                                    <div className="flex flex-wrap">그러면 작업 디렉터리에 있던 커밋 항목들은 삭제되고</div>
                                    <div className="flex flex-wrap">입력한 브랜치에 새로운 커밋이 등록됩니다.</div>
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 mx-5" />
                        </div>
                    </div>

                    <br /><br />
                </>
            }
        </div>
    );
}

const Repository = (props: any): JSX.Element => {
    return <RepositoryProvider props={props} children={Child} />;
}

export default Repository;