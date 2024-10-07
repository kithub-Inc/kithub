'use client';

import { ChevronLeft, Link2Icon, UserRoundPlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import 'moment/locale/ko';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IUser } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Following = (props: any): JSX.Element => {
    const router = useRouter();
    const userData = useUser();

    const [following, setFollowing] = useState<{ node_id: number; user_email: string; target_email: string; user_name: string; avatar_src: string; user_bio: string; created_at: string; }[]>([]);
    const [user, setUser] = useState<IUser>({});

    useEffect(() => {
        (async () => {
            const responseUser = await axios.get(`${process.env.BACKEND_URL}/api/user/${props.params.user_email}`);
            if (responseUser.data.status === 200) setUser(responseUser.data.data);

            const responseFollowing = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/following`);
            if (responseFollowing.data.status === 200) setFollowing(responseFollowing.data.data);
        })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.params.user_email, userData?.user_email]);

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
                            <img src={`${process.env.BACKEND_URL}/api/${user.user_email}/avatar`} alt="Avatar" className="overflow-hidden rounded-full w-7 h-7 object-cover"/>
                        }

                        <h1 style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 mt-1">{user.user_name || user.user_email}</h1>
                    </div>

                    <div className="mt-5 border p-6 rounded-xl bg-white flex items-center justify-between">
                        <div className="flex items-center">
                            <p onClick={() => router.push(`/${props.params.user_email}/following`)} className="flex items-center group hover:text-blue-600 cursor-pointer"><UserRoundPlusIcon className="w-4 h-4 mr-2 group-hover:stroke-blue-600" /><span className="font-bold mr-1">팔로잉</span> 총 {following.length}명</p>
                        </div>
                    </div>
                    
                    {
                        following.map(e =>
                            <Card key={e.node_id}>
                                <CardHeader className="p-6 pb-0">
                                    <div className="flex items-center">
                                        {
                                            e.avatar_src &&
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={`${process.env.BACKEND_URL}/api/${e.user_email}/avatar`} width={1000} height={1000} alt="Avatar" className="overflow-hidden rounded-full w-7 h-7 object-cover mr-2" />
                                        }

                                        <p className="mt-1">{e.user_name || e.user_email}</p>

                                        <Badge variant="outline" className="ml-2">{moment(e.created_at).fromNow()}</Badge>
                                    </div>
                                </CardHeader>
        
                                {
                                    e.user_bio ?
                                    <CardContent className="p-6 py-4 text-sm">{e.user_bio}</CardContent>
                                    :
                                    <div className="pt-4"></div>
                                }
        
                                <CardFooter className="p-6 pt-0">
                                    <Button onClick={() => router.push(`/${e.user_email}`)} variant="outline" size="sm">
                                        <Link2Icon className="w-4 h-4 mr-1.5" />
                                        <span className="mt-0.5">바로가기</span>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    }
                </div>
            </main>
        </>
    );
}

export default Following;