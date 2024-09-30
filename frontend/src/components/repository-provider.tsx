/* eslint-disable react-hooks/rules-of-hooks */

'use client';

import { ChevronLeft, GitBranchIcon, GitCommitIcon, CopyrightIcon, PenLineIcon, BugIcon, GitPullRequestIcon, GitForkIcon, StarIcon } from 'lucide-react';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';
import dotenv from 'dotenv';
import axios from 'axios';

import 'moment/locale/ko';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository, IBranch, ICommit, IDirectory, IProps, IStar } from '@/interfaces/interfaces';

import { useFormat } from '@/components/hooks/use-format';
import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const RepositoryProvider = ({ props, children: Children }: { props: any, children: ({ branch, directory, prevDirectory, readme, content, repository }: IProps) => JSX.Element }): JSX.Element => {
    const { toast } = useToast();
    const userData = useUser();
    const router = useRouter();
    
    const [prevDirectory, setPrevDirectory] = useState<IDirectory[]>([]);
    const [viewDirectory, setViewDirectory] = useState<IDirectory[]>([]);
    const [fileName, setFileName] = useState<string>(`readme.md`);
    const [directory, setDirectory] = useState<IDirectory[]>([]);
    const [repository, setRepository] = useState<IRepository>();
    const [branches, setBranches] = useState<IBranch[]>([]);
    const [commits, setCommits] = useState<ICommit[]>([]);
    const [content, setContent] = useState<string>(``);
    const [readme, setReadme] = useState<string>(``);
    const [commit, setCommit] = useState<ICommit>();
    const [branch, setBranch] = useState<IBranch>({});
    const [stars, setStars] = useState<IStar[]>([]);

    useEffect(() => {
        (async () => {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}`);

            if (response.data.status === 200) {
                const starsResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/stars`);
                if (starsResponse.data.status === 200) setStars(starsResponse.data.data);

                const branchesResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branches`);
                if (branchesResponse.data.status === 200) setBranches(branchesResponse.data.data);

                const commitsResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commits`);
                if (commitsResponse.data.status === 200) setCommits(commitsResponse.data.data);

                setRepository(response.data.data);
            }
        })();
    }, [branch?.node_id, props.params.node_id, toast]);

    const handleChangeBranch = async (value: string): Promise<void> => {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${value}/directory`);

        if (response.data.status === 200) {
            setReadme(response.data.data.filter((e: { name: string; }) => e.name.toLowerCase() === `readme.md`)?.[0]?.content || ``);
            setDirectory(response.data.data);
            setViewDirectory(response.data.data);
            setCommit(response.data.data);

            const branchResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${value}`);
            if (branchResponse.data.status === 200) setBranch(branchResponse.data.data);
        }
    }

    const handleChangeCommit = async (value: string): Promise<void> => {
        const commitResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commit/${value}`);

        if (commitResponse.data.status === 200) {
            const prevCommitDirectoryResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commit/${value}/directory/prev`);
            if (prevCommitDirectoryResponse.data.status === 200) setPrevDirectory(prevCommitDirectoryResponse.data.data);
            else setPrevDirectory([]);

            const directoryResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commit/${value}/directory`);

            if (directoryResponse.data.status === 200) {
                setReadme(directoryResponse.data.data.filter((e: { name: string; }) => e.name.toLowerCase() === `readme.md`)?.[0]?.content || ``);
                setDirectory(directoryResponse.data.data);
                setViewDirectory(directoryResponse.data.data);
            }

            setCommit(commitResponse.data.data);
        }
    }

    const handleStarSubmit = async (): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/star`, { accessToken: localStorage.getItem(`accessToken`) });

        if (response.data.status === 200 && userData?.user_email) {
            const index = stars.findIndex(e => e.user_email === userData?.user_email);
            
            if (index !== -1) {
                const newStars = [...stars];
                newStars.splice(index, 1);
                setStars(newStars);
                
            } else setStars([...stars, { node_id: stars.length, repo_id: props.params.node_id, user_email: userData?.user_email, created_at: new Date().toUTCString() }]);
        }
    }

    return (
        <TooltipProvider>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mx-auto grid w-full lg:w-[59rem] flex-1 auto-rows-max gap-4">
                    <div className="block md:flex w-full items-center justify-between gap-4">
                        <div className="flex items-center">
                            <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">뒤로</span>
                            </Button>

                            <h1 className="ml-3 flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 flex items-center">
                                <Link href={`/${repository?.user_email}`}>{repository?.user_name || repository?.user_email} / {repository?.repo_name}</Link>
                                <Badge className="ml-3 hidden lg:block" variant="outline">{repository?.repo_category}</Badge>
                                {repository?.repo_subcategory && <Badge className="ml-2 hidden lg:block" variant="outline">{repository?.repo_subcategory}</Badge>}
                                <Badge className="ml-3 hidden lg:block">{moment(repository?.created_at).fromNow()}</Badge>
                            </h1>
                        </div>

                        <div className="flex items-center mt-5 md:mt-0">
                            <Badge className="mr-3 flex items-center hidden md:flex" variant="outline">
                                <CopyrightIcon className="w-3 h-3 mr-1 mb-0.5" />
                                {repository?.repo_license}
                            </Badge>

                            <Select onValueChange={handleChangeBranch}>
                                <SelectTrigger className="w-[120px] overflow-hidden">
                                    <div className="flex items-center">
                                        <GitBranchIcon className="mr-2 w-4 h-4" />
                                        <SelectValue placeholder="(선택)" />
                                    </div>
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>모든 브랜치</SelectLabel>

                                        {
                                            branches.map(e =>
                                                <SelectItem key={e.node_id} value={String(e.node_id)}>{e.branch_name}</SelectItem>
                                            )
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <Select onValueChange={handleChangeCommit}>
                                <SelectTrigger className="w-[120px] ml-3 overflow-hidden">
                                    <div className="flex items-center">
                                        <GitCommitIcon className="mr-2 w-4 h-4" />
                                        <SelectValue placeholder="(선택)" />
                                    </div>
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>모든 커밋</SelectLabel>

                                        {
                                            commits.map(e =>
                                                <SelectItem key={e.node_id} value={String(e.node_id)}>{e.commit_message ? e.commit_message : moment(e.created_at).fromNow()}</SelectItem>
                                            )
                                        }
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            
                            {
                                repository?.repo_grantes.find(e => e.target_email === userData?.user_email && e.authority_type === `admin`) &&
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button className="ml-3 flex items-center" onClick={() => router.push(`/repositories/${repository?.node_id}/modify`)} size="icon">
                                            <PenLineIcon className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                        <p>레포지토리 수정</p>
                                    </TooltipContent>
                                </Tooltip>
                            }

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 ml-3">
                                        <span className="sr-only">메뉴 열기</span>
                                        <DotsHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>액션</DropdownMenuLabel>

                                    <DropdownMenuItem onClick={() => router.push(`/${repository?.user_email}`)}>작성자 보기</DropdownMenuItem>
                                    {
                                        userData &&
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>신고</DropdownMenuItem>
                                            {
                                                userData?.user_email === repository?.user_email &&
                                                <DropdownMenuItem>삭제</DropdownMenuItem>
                                            }
                                        </>
                                    }
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="w-full block md:flex justify-between items-center mt-5 md:mt-0">
                        <p className="leading-5 [&:not(:first-child)]:mt-6" dangerouslySetInnerHTML={{ __html: repository?.repo_description.replace(/ /g, `\u00A0`).replace(/\n/g, `<br>`) || `(내용 없음)` }} />
                        
                        <div className="block md:flex mt-5 md:mt-0 justify-end items-center">
                            <Button className={(stars.length === 0 && `h-8 w-8 p-0 flex items-center`) + ` mr-3`} size={stars.length === 0 ? `icon` : `default`} variant="ghost" onClick={handleStarSubmit}>
                                {
                                    stars.find(e => e.user_email === userData?.user_email) ?
                                    <StarIcon fill="#000000" className="w-4 h-4" />
                                    :
                                    <StarIcon className="w-4 h-4" />
                                }

                                {stars.length > 0 && <span className="ml-2 mt-0.5">{useFormat(stars.length)}</span>}
                            </Button>

                            <Button variant="outline" onClick={() => router.push(`/repositories/${props.params.node_id}/issues`)}>
                                <BugIcon className="mr-2 w-4 h-4" />
                                이슈
                            </Button>

                            <Button className="ml-3" variant="outline" onClick={() => router.push(`/repositories/${props.params.node_id}/pullrequests`)}>
                                <GitPullRequestIcon className="mr-2 w-4 h-4" />
                                풀리퀘스트
                            </Button>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button className="ml-3" size="icon" onClick={() => router.push(`/repositories/${props.params.node_id}/fork`)}>
                                        <GitForkIcon className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>

                                <TooltipContent>
                                    <p>포크</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <Children repository={repository} branch={branch} directory={directory} prevDirectory={prevDirectory} readme={readme} content={content} viewDirectory={viewDirectory} setViewDirectory={setViewDirectory} fileName={fileName} setFileName={setFileName} />
                </div>
            </main>
        </TooltipProvider>
    );
}

export default RepositoryProvider;