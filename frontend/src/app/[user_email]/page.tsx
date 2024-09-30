'use client';

import { CalendarIcon, ChevronLeft, MailIcon, PlusIcon, ShellIcon, SquareUserRoundIcon, UserRoundPlusIcon } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository, IUser } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Repository = (props: any): JSX.Element => {
    const router = useRouter();
    const userData = useUser();

    const [following, setFollowing] = useState<{ node_id: number; user_email: string; target_email: string; }[]>([]);
    const [follower, setFollower] = useState<{ node_id: number; user_email: string; target_email: string; }[]>([]);
    const [repositories, setRepositories] = useState<IRepository[]>([]);
    const [user, setUser] = useState<IUser>({});

    useEffect(() => {
        (async () => {
            const responseRepositories = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/repositories`);
            if (responseRepositories.data.status === 200) setRepositories(responseRepositories.data.data);

            const responseUser = await axios.get(`${process.env.BACKEND_URL}/api/user/${props.params.user_email}`);
            if (responseUser.data.status === 200) setUser(responseUser.data.data);

            const responseFollowing = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/following`);
            if (responseFollowing.data.status === 200) setFollowing(responseFollowing.data.data);
            const responseFollower = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/follower`);
            if (responseFollower.data.status === 200) setFollower(responseFollower.data.data);
        })();
    }, [props.params.user_email]);

    const handleFollow = async () => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/user/follow`, { accessToken: localStorage.getItem(`accessToken`), user_email: user.user_email });
        if (response.data.status === 200) {
            const responseFollowing = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/following`);
            if (responseFollowing.data.status === 200) setFollowing(responseFollowing.data.data);
            const responseFollower = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/follower`);
            if (responseFollower.data.status === 200) setFollower(responseFollower.data.data);
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
                            user.avatar_src &&
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${process.env.BACKEND_URL}/api/${user.user_email}/avatar`} width={1000} height={1000} alt="Avatar" className="overflow-hidden rounded-full w-7 h-7 object-cover"/>
                        }

                        <h1 style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 mt-1">{user.user_name || user.user_email}</h1>
                    </div>

                    <div className="mt-5 border p-6 rounded-xl bg-white flex items-center justify-between">
                        <div className="flex items-center">
                            <p className="flex items-center group hover:text-blue-600 cursor-pointer"><UserRoundPlusIcon className="w-4 h-4 mr-2 group-hover:stroke-blue-600" /><span className="font-bold mr-1">팔로잉</span> {following.length}명</p>
                            <Separator orientation="vertical" className="mx-4 h-[30px]" />
                            <p className="flex items-center group hover:text-blue-600 cursor-pointer"><SquareUserRoundIcon className="w-4 h-4 mr-2 group-hover:stroke-blue-600" /><span className="font-bold mr-1">팔로워</span> {follower.length}명</p>
                        </div>

                        {
                            userData?.user_email !== user.user_email &&
                            (
                                userData && follower.find(e => e.user_email === userData.user_email) ?
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
                                <p className="text-sm mt-1">{user.user_email}</p>
                            </div>

                            <Separator className="mx-5 h-12 hidden sm:block" orientation="vertical" />
                            
                            <div className="sm:my-0 mt-5">
                                <p className="text-base font-bold flex items-center"><ShellIcon className="w-4 h-4 mr-2" /> 설명</p>
                                <p className="text-sm mt-1">{user.user_bio}</p>
                            </div>
                        </div>

                        <p className="mt-10 text-sm flex items-center"><CalendarIcon className="w-4 h-4 mr-2" /> <span className="font-bold">{moment(user.created_at).format(`YYYY년 MM월 DD일`)}</span>에 가입함</p>
                    </div>

                    <p className="text-lg mt-10"><span className="font-bold">{user.user_name || user.user_email}</span>님의 레포지토리</p>
                    
                    <div className="flex flex-wrap items-start max-w-[59rem]">
                        {
                            repositories.map(e =>
                                <Card key={e.node_id} className="mr-5 mb-5 w-full md:w-72">
                                    <CardHeader>
                                        <CardTitle>
                                            {
                                                e.image_src &&
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img className="w-72 mb-5" src={`${process.env.BACKEND_URL}/api/repository/${e.node_id}/topic_image`} alt="repo_image" />
                                            }

                                            <div className="flex items-center justify-between">
                                                {e.repo_name}

                                                <div>
                                                    <Badge variant="outline">{e.repo_category}</Badge>
                                                    {e.repo_subcategory && <Badge className="ml-2" variant="outline">{e.repo_subcategory}</Badge>}
                                                </div>
                                            </div>
                                        </CardTitle>

                                        <CardDescription>{e.repo_description}</CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex items-center justify-between">
                                        <Button onClick={() => router.push(`/repositories/${e.node_id}`)} size="sm" variant="secondary">자세히 보기</Button>
                                    </CardContent>
                                </Card>
                            )
                        }
                    </div>
                </div>
            </main>
        </>
    );
}

export default Repository;