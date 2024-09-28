'use client';

import { ChevronLeft, StarIcon } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dotenv from 'dotenv';
import axios from 'axios';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository, IUser } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Repository = (props: any): JSX.Element => {
    const router = useRouter();
    const userData = useUser();

    const [user, setUser] = useState<IUser>({});
    const [repositories, setRepositories] = useState<IRepository[]>([]);

    useEffect(() => {
        (async () => {
            const responseRepositories = await axios.get(`${process.env.BACKEND_URL}/api/${props.params.user_email}/repositories`);
            if (responseRepositories.data.status === 200) setRepositories(responseRepositories.data.data);

            const responseUser = await axios.get(`${process.env.BACKEND_URL}/api/user/${props.params.user_email}`);
            if (responseUser.data.status === 200) setUser(responseUser.data.data);
        })();
    }, [props.params.user_email]);

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

                        <h1 style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">{user.user_name || user.user_email}</h1>
                    </div>
                    
                    <div className="mt-5">
                        <p className="text-base font-bold">설명</p>
                        <p className="text-sm">{user.user_bio}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-start mt-5 max-w-[59rem]">
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