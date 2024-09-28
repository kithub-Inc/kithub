'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import dotenv from 'dotenv';
import path from 'path';

import { FolderIcon, FileJson2Icon, FileImageIcon, FileVideo2Icon, FolderTreeIcon, PencilRulerIcon, DiffIcon } from 'lucide-react';

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

const Repository = (props: any): JSX.Element => {
    const [content, setContent] = useState<string>(``);

    return (
        <RepositoryProvider props={props}>
            {
                ({ branch, directory, prevDirectory, readme, viewDirectory, setViewDirectory, fileName, setFileName }: IProps) =>
                    <div className="max-w-[59rem]">
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
                                    <div className="code2" dangerouslySetInnerHTML={{ __html: content.replace(/ /g, `\u00A0`).replace(/\n/g, `<br>`) }} />
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
                    </div>
            }
        </RepositoryProvider>
    );
}

export default Repository;