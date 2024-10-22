'use client';

import { ChevronLeft } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import dotenv from 'dotenv';
import axios from 'axios';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import RepositoryItem from '@/components/repository-item';

import { IRepository } from '@/interfaces/interfaces';

dotenv.config();

const Topic = (): JSX.Element => {
    const [categories, setCategories] = useState<{ repo_category: string; }[]>([]);
    const [repositories, setRepositories] = useState<IRepository[]>([]);
    const [category, setCategory] = useState<string>(`all`);

    const { isLoading, refetch } = useQuery(`topic_repositories`, async () => {
        const response = await axios.get(`${process.env.BACKEND_URL}/api/topics/${category}`);

        if (response.data.status === 200) {
            setRepositories(response.data.data);
            return response.data.data;

        } else return;
    });

    useEffect(() => {
        (async () => {
            const categoriesResponse = await axios.get(`${process.env.BACKEND_URL}/api/categories`);
            setCategories(categoriesResponse.data.data);
            refetch();
        })();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category]);

    return (
        <>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mx-auto grid w-full md:max-w-[59rem] px-8 md:px-0 flex-1 auto-rows-max gap-4">
                    <div className="flex items-center gap-4 justify-between max-w-[59rem]">
                        <div className="flex items-center gap-4">
                            <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">뒤로</span>
                            </Button>

                            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">토픽</h1>
                        </div>

                        <Select value={category} onValueChange={e => setCategory(e)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="카테고리" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>모든 카테고리</SelectLabel>
                                    
                                    <SelectItem value="all">모두</SelectItem>
                                    {
                                        categories.map((e, idx) =>
                                            <SelectItem key={idx} value={e.repo_category.toLowerCase()}>{e.repo_category}</SelectItem>
                                        )
                                    }
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[59rem]">
                        {
                            isLoading ?
                            <>
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                                <Skeleton className="w-[300px] h-[200px]" />
                            </>
                            :
                            repositories.map(e =>
                                <RepositoryItem key={e.node_id} e={e} />
                            )
                        }
                    </div>
                </div>
            </main>
        </>
    );
}

export default Topic;