/* eslint-disable react-hooks/rules-of-hooks */

'use client';

import { AntennaIcon, GitPullRequestIcon, CornerDownRightIcon, HeartIcon, XIcon, GitBranchIcon, ArrowRightIcon, GitCommitIcon } from 'lucide-react';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import moment from 'moment';
import dotenv from 'dotenv';
import axios from 'axios';

import 'moment/locale/ko';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import RepositoryProvider from '@/components/repository-provider';

import { IProps, IComments, IPullRequest } from '@/interfaces/interfaces';

import { useFormat } from '@/components/hooks/use-format';
import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const RepositoryPullRequest = (props: any): JSX.Element => {
    const router = useRouter();
    const { data: userData } = useUser();

    const [comments, setComments] = useState<IComments[]>([]);
    const [reply, setReply] = useState<IComments | null>(null);
    const [pullrequest, setPullRequest] = useState<IPullRequest>();

    const comment = useRef<any>(null);

    useEffect(() => {
        (async () => {
            const responseIssue = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${props.params.pr_id}`);
            if (responseIssue.data.status === 200) setPullRequest(responseIssue.data.data);
        })();
    }, [props.params.pr_id, props.params.node_id]);

    const handleCommentSubmit = async (): Promise<void> => {
        if (comment.current) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/comment/create`, { accessToken: localStorage.getItem(`accessToken`), comment_content: comment.current.value, reply: reply?.node_id });
            if (response.data.status === 200 && comment.current) {
                const responseComments = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/comments`);
                if (responseComments.data.status === 200) setComments(responseComments.data.data);
            }
        }
    }

    const handleHeartsSubmit = (value: number) => {
        return () => {
            axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/comment/${value}/heart`, { accessToken: localStorage.getItem(`accessToken`) }).then(e => {
                if (e.data.status === 200 && userData?.user_email) {
                    const comment = comments.find(e => e.node_id === value);

                    if (comment) {
                        const index = comment.hearts.findIndex(e => e.user_email === userData?.user_email);
                        
                        if (index !== -1) {
                            comment.hearts.splice(index, 1);
                            setComments([...comments]);
                            
                        } else {
                            comment.hearts.push({ node_id: comment.hearts.length, comment_id: value, user_email: userData?.user_email, created_at: new Date().toUTCString() });
                            setComments([...comments]);
                        }
                    }
                }
            });
        }
    }

    const handleStatusChange = async (value: string): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${props.params.pr_id}/status`, { accessToken: localStorage.getItem(`accessToken`), status: value });
        if (response.data.status === 200) {
            const responseIssue = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${props.params.pr_id}`);
            if (responseIssue.data.status === 200) setPullRequest(responseIssue.data.data);
        }
    }

    const handleIssueRemoveSubmit = async (): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
        if (response.data.status === 200) router.push(`/repositories/${props.params.node_id}/pullrequests`);
    }

    const handleCommentRemoveSubmit = async (node_id: number): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/comments/${node_id}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
        if (response.data.status === 200) {
            const responseComments = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequest?.node_id}/comments`);
            if (responseComments.data.status === 200) setComments(responseComments.data.data);
        }
    }

    return (
        <RepositoryProvider props={props}>
            {
                ({ repository }: IProps) =>
                    <div className="max-w-[59rem]">
                        <div className="mt-10">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>{repository?.user_name || repository?.user_email}</BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>{repository?.repo_name}</BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem className="flex items-center"><GitPullRequestIcon className="mr-0.5 w-4 h-4" /> 이슈</BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem><BreadcrumbPage>{pullrequest?.pr_title}</BreadcrumbPage></BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>

                            <div className="markdown">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge><GitBranchIcon className="w-3 h-3 !mr-1.5" /> {pullrequest?.branch_name} <ArrowRightIcon className="w-3 h-3 !mx-2.5" /> <GitBranchIcon className="w-3 h-3 !mr-1.5" /> {pullrequest?.target_branch_name}</Badge>
                                        <Badge variant="outline"><GitCommitIcon className="w-3 h-3 !mr-1.5" /> {pullrequest?.commit_id}</Badge>
                                    </div>

                                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 transition-all hover:from-blue-700 hover:to-blue-800">브랜치 병합</Button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button size="sm" className="!h-[22px] flex items-center !mr-3" style={{ fontSize: `12px` }} variant={pullrequest?.pr_status === `대기` ? `secondary` : (pullrequest?.pr_status === `진행중` ? `outline` : (pullrequest?.pr_status === `성공` ? `default` : `destructive`))}>{pullrequest?.pr_status}</Button>
                                            </PopoverTrigger>

                                            <PopoverContent className="w-[175px]">
                                                {
                                                    userData?.user_email === repository?.user_email &&
                                                    <Select onValueChange={handleStatusChange}>
                                                        <SelectTrigger className="w-full">
                                                            <div className="flex items-center">
                                                                <AntennaIcon className="w-4 h-4 mr-2" />
                                                                <SelectValue placeholder="(선택)" />
                                                            </div>
                                                        </SelectTrigger>
    
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>모든 상태</SelectLabel>
    
                                                                <SelectItem value="대기">대기</SelectItem>
                                                                <SelectItem value="진행중">진행중</SelectItem>
                                                                <SelectItem value="성공">성공</SelectItem>
                                                                <SelectItem value="실패">실패</SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                }
                                            </PopoverContent>
                                        </Popover>

                                        <Badge variant="outline">{moment(pullrequest?.created_at).fromNow()}</Badge>
                                        <h2 className="!ml-3">{pullrequest?.pr_title}</h2>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">메뉴 열기</span>
                                                <DotsHorizontalIcon className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>액션</DropdownMenuLabel>

                                            <DropdownMenuItem onClick={() => router.push(`/${pullrequest?.user_email}`)}>작성자 보기</DropdownMenuItem>
                                            {
                                                userData &&
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>신고</DropdownMenuItem>
                                                    {
                                                        userData?.user_email === pullrequest?.user_email &&
                                                        <DropdownMenuItem onClick={handleIssueRemoveSubmit}>삭제</DropdownMenuItem>
                                                    }
                                                </>
                                            }
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <ReactMarkdown className="leading-7" remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
                                    {pullrequest?.pr_content}
                                </ReactMarkdown>
                            </div>

                            <div className="mt-10">
                                {
                                    comments.map(e =>
                                        <Card key={e.node_id} className="mb-5">
                                            <CardHeader className="pb-4">
                                                {
                                                    e.comment_type === `reply` &&
                                                    <div className="flex items-center mb-1 ml-2 opacity-60">
                                                        <CornerDownRightIcon className="w-4 h-4" />
                                                        <span onClick={() => router.push(`/${(e as any).ric_user_email}`)} className="text-blue-900 ml-2 border-b-[1px] leading-none border-blue-900 cursor-pointer border-neutral-950">@{(e as any).ric_user_email === userData?.user_email ? `나` : ((e as any).ric_user_name || (e as any).ric_user_email)}</span>
                                                        <span className="ml-1">에게 답장</span>
                                                    </div>
                                                }

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center cursor-pointer" onClick={() => router.push(`/${e.user_email}`)}>
                                                        {
                                                            e.avatar_src &&
                                                            <Image className="rounded-full w-6 h-6 mr-2" width={100} height={100} src={e.avatar_src} alt="avatar" />
                                                        }
                                                        {(e as any).user_email === userData?.user_email ? `나` : ((e as any).user_name || (e as any).user_email)}
                                                    </div>
                                                    
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">메뉴 열기</span>
                                                                <DotsHorizontalIcon className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
        
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>액션</DropdownMenuLabel>
        
                                                            <DropdownMenuItem onClick={() => router.push(`/${e.user_email}`)}>작성자 보기</DropdownMenuItem>
                                                            {
                                                                userData &&
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem>신고</DropdownMenuItem>
                                                                    {
                                                                        userData?.user_email === e?.user_email &&
                                                                        <DropdownMenuItem onClick={() => handleCommentRemoveSubmit(e.node_id)}>삭제</DropdownMenuItem>
                                                                    }
                                                                </>
                                                            }
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>
        
                                            <CardContent className="py-0 pb-4">
                                                <ReactMarkdown className="leading-7 markdown" remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
                                                    {e.comment_content}
                                                </ReactMarkdown>
                                            </CardContent>
        
                                            <CardFooter>
                                                <div className="flex items-center">
                                                    <Button className={e.hearts?.length === 0 ? `h-8 w-8 p-0 flex items-center` : ``} size={e.hearts?.length === 0 ? `icon` : `default`} variant="ghost" onClick={handleHeartsSubmit(e.node_id)}>
                                                        {
                                                            e.hearts?.find(e => e.user_email === userData?.user_email) ?
                                                            <HeartIcon fill="#000000" className="w-4 h-4" />
                                                            :
                                                            <HeartIcon className="w-4 h-4" />
                                                        }

                                                        {e.hearts?.length > 0 && <span className="ml-2 mt-0.5">{useFormat(e.hearts?.length)}</span>}
                                                    </Button>

                                                    {userData && <Button size="sm" className="ml-3" onClick={() => setReply(e)}>댓글 남기기</Button>}
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    )
                                }
                            </div>

                            {
                                userData &&
                                <>
                                    {
                                        reply &&
                                        <div className="mt-10 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <CornerDownRightIcon className="w-4 h-4" />
                                                <span className="text-blue-900 ml-2">{reply.user_email === userData?.user_email ? `나` : (reply?.user_name || reply?.user_email)}</span>
                                                <span className="ml-1">님에게 답장중</span>
                                            </div>

                                            <Button size="icon" variant="ghost" onClick={() => setReply(null)}>
                                                <XIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    }

                                    <div className={reply ? `mt-5` : `mt-10`}>
                                        <Textarea ref={comment} placeholder="댓글 남기기..." />
                                        <Button className="mt-3" onClick={handleCommentSubmit}>댓글 작성</Button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
            }
        </RepositoryProvider>
    );
}

export default RepositoryPullRequest;