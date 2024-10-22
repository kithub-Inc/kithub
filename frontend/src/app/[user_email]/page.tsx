'use client';

import { CalendarIcon, ChevronLeft, MailIcon, PlusIcon, ShellIcon, SquareUserRoundIcon, UserRoundPlusIcon } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import RepositoryItem from '@/components/repository-item';

import { IRepository, IUser } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Repository = (props: any): JSX.Element => {
    const router = useRouter();
    const { data: userData } = useUser();

    const { isLoading: reposIsLoading } = useQuery(`user_repositories`, async () => {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/repositories`);

        if (response.data.status === 200) {
            setRepositories(response.data.data);
            return response.data.data;

        } else return;
    });

    const { isLoading: userIsLoading } = useQuery(`user_user`, async () => {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/user/${props.params.user_email}`);

        if (response.data.status === 200) {
            setUser(response.data.data);
            return response.data.data;

        } else return;
    });

    const [following, setFollowing] = useState<{ node_id: number; user_email: string; target_email: string; }[]>([]);
    const [follower, setFollower] = useState<{ node_id: number; user_email: string; target_email: string; }[]>([]);
    const [repositories, setRepositories] = useState<IRepository[]>([]);
    const [state, setState] = useState<boolean>(false);
    const [user, setUser] = useState<IUser>({});

    useEffect(() => {
        (async () => {
            const responseFollowing = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/following`);
            if (responseFollowing.data.status === 200) setFollowing(responseFollowing.data.data);
            const responseFollower = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/follower`);
            if (responseFollower.data.status === 200) setFollower(responseFollower.data.data);
            setState(responseFollower.data.data?.find?.((e: any) => e.user_email === userData.user_email) ? true : false);
        })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.params.user_email, userData?.user_email]);

    const handleFollow = async (): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/user/follow`, { accessToken: localStorage.getItem(`accessToken`), user_email: user.user_email });
        if (response.data.status === 200) setState(!state);
    }

    const handleViewPrivateSubmit = async (view: boolean): Promise<void> => {
        if (view) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/view-private`, { accessToken: localStorage.getItem(`accessToken`), user_email: user.user_email });
            if (response.data.status === 200) setRepositories(response.data.data);
            
        } else {
            const responseRepositories = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/repositories`);
            if (responseRepositories.data.status === 200) setRepositories(responseRepositories.data.data);
        }
    }

    return (
        <>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mx-auto grid w-full md:max-w-[59rem] px-8 md:px-0 flex-1 auto-rows-max gap-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">뒤로</span>
                        </Button>

                        {
                            userIsLoading ?
                            <Skeleton className="w-7 h-7 rounded-full" />
                            :
                            user.avatar_src &&
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_src} width={1000} height={1000} alt="Avatar" className="overflow-hidden rounded-full w-7 h-7 object-cover"/>
                        }

                        {
                            userIsLoading ?
                            <Skeleton className="w-14 h-6" />
                            :
                            <h1 style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 mt-1">{user.user_name || user.user_email}</h1>
                        }
                    </div>

                    <div className="mt-5 border p-6 rounded-xl bg-white flex items-center justify-between">
                        <div className="flex items-center">
                            {
                                userIsLoading ?
                                <>
                                    <Skeleton className="w-20 h-8" />
                                    <Separator orientation="vertical" className="mx-4 h-[30px]" />
                                    <Skeleton className="w-20 h-8" />
                                </>
                                :
                                <>
                                    <p onClick={() => router.push(`/${props.params.user_email}/following`)} className="flex items-center group hover:text-blue-600 cursor-pointer"><UserRoundPlusIcon className="w-4 h-4 mr-2 group-hover:stroke-blue-600" /><span className="font-bold mr-1">팔로잉</span> {following.length}명</p>
                                    <Separator orientation="vertical" className="mx-4 h-[30px]" />
                                    <p onClick={() => router.push(`/${props.params.user_email}/follower`)} className="flex items-center group hover:text-blue-600 cursor-pointer"><SquareUserRoundIcon className="w-4 h-4 mr-2 group-hover:stroke-blue-600" /><span className="font-bold mr-1">팔로워</span> {follower.length}명</p>
                                </>
                            }
                        </div>

                        {
                            userData && (userData?.user_email !== user.user_email) &&
                            (
                                state ?
                                <Button size="sm" onClick={handleFollow} variant="outline">팔로잉</Button>
                                :
                                <Button size="sm" onClick={handleFollow}><PlusIcon className="w-3 h-3 mr-1" /> 팔로우</Button>
                            )
                        }
                    </div>
                    
                    <div className="mt-1 border p-6 rounded-xl bg-white">
                        <div className="block sm:flex items-start">
                            <div>
                                <p className="text-base font-bold flex items-center"><MailIcon className="w-4 h-4 mr-2" /> 이메일</p>
                                
                                {
                                    userIsLoading ?
                                    <Skeleton className="mt-1 w-48 h-4" />
                                    :
                                    <p className="text-sm mt-1">{user.user_email}</p>
                                }
                            </div>

                            <Separator className="mx-5 h-12 hidden sm:block" orientation="vertical" />
                            
                            <div className="sm:my-0 mt-5">
                                <p className="text-base font-bold flex items-center"><ShellIcon className="w-4 h-4 mr-2" /> 설명</p>

                                {
                                    userIsLoading ?
                                    <>
                                        <Skeleton className="mt-1 w-36 h-4" />
                                        <Skeleton className="mt-2 w-48 h-4" />
                                        <Skeleton className="mt-2 w-24 h-4" />
                                    </>
                                    :
                                    <p className="text-sm mt-1">{user.user_bio}</p>
                                }
                            </div>
                        </div>
                        
                        {
                            userIsLoading ?
                            <Skeleton className="mt-10 w-48 h-4" />
                            :
                            <p className="mt-10 text-sm flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> <span className="font-bold">{moment(user.created_at).format(`YYYY년 MM월 DD일`)}</span>에 가입함</p>
                        }
                    </div>

                    <div className="mt-10 flex items-center justify-between">
                        <p className="text-lg"><span className="font-bold">{user.user_name || user.user_email}</span>님의 레포지토리</p>

                        {
                            userData?.user_email === user.user_email &&
                            <div className="flex items-center space-x-3">
                                <Label htmlFor="view-private">
                                    <Badge variant="outline">view-private</Badge>
                                </Label>
    
                                <Switch id="view-private" onCheckedChange={handleViewPrivateSubmit} />
                            </div>
                        }
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[59rem]">
                        {
                            reposIsLoading ?
                            <>
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                            </>
                            :
                            repositories.map(e =>
                                <RepositoryItem key={e.node_id} e={e} bool />
                            )
                        }
                    </div>
                </div>
            </main>
        </>
    );
}

export default Repository;