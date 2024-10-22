/* eslint-disable react-hooks/rules-of-hooks */

'use client';

import { ChevronLeft, GitBranchIcon, GitCommitIcon, CopyrightIcon, PenLineIcon, BugIcon, GitPullRequestIcon, GitForkIcon, StarIcon, CalendarIcon } from 'lucide-react';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import Link from 'next/link';
import moment from 'moment';
import dotenv from 'dotenv';
import axios from 'axios';

import 'moment/locale/ko';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository, IBranch, ICommit, IDirectory, IProps, IStar } from '@/interfaces/interfaces';

import { useFormat } from '@/components/hooks/use-format';
import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const RepositoryProvider = ({ props, children: Children }: { props: any, children: ({ commit, branch, directory, prevDirectory, readme, content, repository }: IProps) => JSX.Element }): JSX.Element => {
    const { toast } = useToast();
    const { data: userData } = useUser();
    const router = useRouter();
    
    const [prevDirectory, setPrevDirectory] = useState<IDirectory[]>([]);
    const [viewDirectory, setViewDirectory] = useState<IDirectory[]>([]);
    const [fileName, setFileName] = useState<string>(`readme.md`);
    const [directory, setDirectory] = useState<IDirectory[]>([]);
    const [repository, setRepository] = useState<IRepository>();
    const [branches, setBranches] = useState<IBranch[]>([]);
    const [commits, setCommits] = useState<ICommit[]>([]);
    const [content, setContent] = useState<string>(``);
    const [branch, setBranch] = useState<IBranch>({});
    const [readme, setReadme] = useState<string>(``);
    const [commit, setCommit] = useState<ICommit>();
    const [stars, setStars] = useState<IStar[]>([]);
    const [type, setType] = useState<string>(``);

    const { isLoading } = useQuery(`repository`, async () => {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}`);

        if (response.data.status === 200) {
            setRepository(response.data.data);
            return response.data.data;

        } else return;
    });

    useEffect(() => {
        (async () => {
            const starsResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/stars`);
            if (starsResponse.data.status === 200) setStars(starsResponse.data.data);

            const branchesResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branches`);
            if (branchesResponse.data.status === 200) setBranches(branchesResponse.data.data);

            const commitsResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commits`);
            if (commitsResponse.data.status === 200) setCommits(commitsResponse.data.data);
        })();
    }, [branch?.node_id, props.params.node_id, toast]);

    const handleChangeBranch = async (value: string): Promise<void> => {
        const branchResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${value}`);
        if (branchResponse.data.status === 200) setBranch(branchResponse.data.data);
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

    const handleBranchRemoveSubmit = async (): Promise<void> => {
        if (branch?.node_id) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
            if (response.data.status === 200) {
                const branchesResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branches`);
                if (branchesResponse.data.status === 200) setBranches(branchesResponse.data.data);
    
                const commitsResponse = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/branch/${branch?.node_id}/commits`);
                if (commitsResponse.data.status === 200) setCommits(commitsResponse.data.data);
            }

        } else toast({ title: `브랜치를 선택해주세요. `});
    }

    const handleRepositoryRemoveSubmit = async (): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
        if (response.data.status === 200) router.push(`/${userData.user_email}`);
    }

    return (
        <AlertDialog>
            <TooltipProvider>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                    <div className="mx-auto grid w-full lg:w-[59rem] flex-1 auto-rows-max gap-0 md:gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {
                                    isLoading ?
                                    <>
                                        <Skeleton className="w-16 h-5" />
                                        <Skeleton className="w-16 h-5 ml-3" />
                                        <Skeleton className="w-16 h-5 ml-3" />
                                    </>
                                    :
                                    <>
                                        <Badge variant="outline">{repository?.repo_category}</Badge>
                                        {repository?.repo_subcategory && <Badge className="ml-2" variant="outline">{repository?.repo_subcategory}</Badge>}
                                        <Badge className="ml-3 flex items-center"><GitForkIcon className="w-3 h-3 mr-1.5" /> {repository?.repo_type === `forked` ? `포크됨` : `기본`}</Badge>
                                    </>
                                }
                            </div>

                            <div className="flex items-center">
                                {
                                    isLoading ?
                                    <>
                                        <Skeleton className="w-24 h-5" />
                                        <Skeleton className="w-24 h-5 ml-3" />
                                    </>
                                    :
                                    <>
                                        <Badge className="mr-3 flex items-center hidden md:flex" variant="outline">
                                            <CopyrightIcon className="w-3 h-3 mr-1 mb-0.5" />
                                            {repository?.repo_license}
                                        </Badge>
                                        
                                        <Badge variant="outline" className="font-normal"><CalendarIcon className="w-3 h-3 mr-1.5" /> {moment(repository?.created_at).format(`YYYY년 MM월 DD일`)}</Badge>
                                    </>
                                }
                            </div>
                        </div>
                        
                        <div className="mt-7">
                            <div className="block md:flex w-full items-center justify-between gap-4">
                                <div className="flex items-center">
                                    <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="sr-only">뒤로</span>
                                    </Button>

                                    <div className="mb-5 ml-3 flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 flex flex-col">
                                        {
                                            isLoading ?
                                            <>
                                                <Skeleton className="w-12 h-4" />
                                                <Skeleton className="w-28 h-6 mt-3" />
                                            </>
                                            :
                                            <>
                                                <Link className="text-sm text-slate-500" href={`/${repository?.user_email}`}>{repository?.user_name}</Link>
                                                <span onClick={() => location.reload()}>{repository?.repo_name}</span>
                                            </>
                                        }
                                    </div>
                                </div>
                                
                                {
                                    isLoading ?
                                    <>
                                        <Skeleton className="block md:hidden mt-5 w-32 h-4" />
                                        <Skeleton className="block md:hidden mt-2 w-14 h-4" />
                                        <Skeleton className="block md:hidden mt-2 w-24 h-4" />
                                    </>
                                    :
                                    <p className="leading-5 mt-5 whitespace-pre-line block md:hidden">{repository?.repo_description}</p>
                                }
                                <div className="h-[20px]"></div>

                                <div className="flex items-center justify-end md:justify-start mt-5 md:mt-0">
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
                                                        <SelectItem key={e.node_id} value={String(e.node_id)}>
                                                            <Badge variant="outline" className="mr-2">{e.node_id}</Badge>
                                                            {e.commit_message ? e.commit_message : moment(e.created_at).fromNow()}
                                                        </SelectItem>
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
                                                        <>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onClick={() => setType(`repo`)}>삭제</DropdownMenuItem>
                                                            </AlertDialogTrigger>

                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem onClick={() => setType(`branch`)}>{branch?.branch_name} 브랜치 삭제</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </>
                                                    }
                                                </>
                                            }
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="w-full flex justify-end md:justify-between items-start">
                                {
                                    isLoading ?
                                    <div>
                                        <Skeleton className="w-64 h-4" />
                                        <Skeleton className="mt-2 w-32 h-4" />
                                    </div>
                                    :
                                    <p className="w-[400px] leading-5 [&:not(:first-child)]:mt-6 whitespace-pre-line hidden md:block">{repository?.repo_description}</p>
                                }
                                
                                <div className="flex mt-3 md:mt-0 justify-end items-center">
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
                                    
                                    {
                                        userData &&
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
                                    }
                                </div>
                            </div>
                        </div>

                        <Children props={props} commit={commit} repository={repository} branch={branch} directory={directory} prevDirectory={prevDirectory} readme={readme} content={content} viewDirectory={viewDirectory} setViewDirectory={setViewDirectory} fileName={fileName} setFileName={setFileName} />
                    </div>
                </main>
            </TooltipProvider>

            <AlertDialogContent>
                {
                    type === `branch` ?
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 이 브랜치를 지우시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            브랜치를 지우면, 다시 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    : type === `repo` ?
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 이 레포지토리를 지우시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            레포지토리를 지우면, 다시 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    :
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 이 이슈를 지우시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            이슈를 지우면, 다시 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                }

                <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={type === `branch` ? handleBranchRemoveSubmit : type === `repo` ? handleRepositoryRemoveSubmit : () => {}}>계속</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default RepositoryProvider;