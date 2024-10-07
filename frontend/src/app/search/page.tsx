'use client';

import { AlbumIcon, ChevronLeft, Link2Icon, SquareUserRoundIcon } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import axios from 'axios';

import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import RepositoryItem from '@/components/repository-item';

import { IRepository, IUser } from '@/interfaces/interfaces';

dotenv.config();

const Search = (props: any): JSX.Element => {
    const router = useRouter();

    const [repositories, setRepositories] = useState<IRepository[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);

    useEffect(() => {
        (async () => {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/search?q=${props.searchParams.q}`);
            setRepositories(response.data.data.repositories);
            setUsers(response.data.data.users);
        })();
    }, [props.searchParams.q]);

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
            <div className="mx-auto grid w-full md:max-w-[59rem] px-8 md:px-0 flex-1 auto-rows-max gap-4">
                <div className="flex items-center gap-4">
                    <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">뒤로</span>
                    </Button>

                    <p style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl tracking-tight sm:grow-0 mt-1">{`"`}<span className="font-bold">{props.searchParams.q}</span>{`"`} 에 대한 검색결과</p>
                </div>

                <p className="mt-5 font-bold flex items-center"><AlbumIcon className="w-4 h-4 mr-2 mb-0.5" /> 관련 레포지토리</p>

                <div className="flex flex-wrap items-start">
                    {
                        repositories.map(e =>
                            <RepositoryItem key={e.node_id} e={e} />
                        )
                    }
                </div>

                <p className="font-bold flex items-center"><SquareUserRoundIcon className="w-4 h-4 mr-2 mb-0.5" /> 관련 유저</p>

                {
                    users.map(e =>
                        <Card key={e.node_id}>
                            <CardHeader className="p-6 pb-0">
                                <div className="flex items-center">
                                    {
                                        e.avatar_src &&
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={`${process.env.BACKEND_URL}/api/${e.user_email}/avatar`} width={1000} height={1000} alt="Avatar" className="overflow-hidden rounded-full w-7 h-7 object-cover mr-2" />
                                    }

                                    <p className="mt-1">{e.user_name || e.user_email}</p>
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
    );
}

export default Search;