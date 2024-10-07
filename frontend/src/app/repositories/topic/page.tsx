'use client';

import { ChevronLeft } from 'lucide-react';

import { useEffect, useState } from 'react';
import dotenv from 'dotenv';
import axios from 'axios';

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import RepositoryItem from '@/components/repository-item';

import { IRepository } from '@/interfaces/interfaces';

dotenv.config();

const Topic = (): JSX.Element => {
    const [repositories, setRepositories] = useState<IRepository[]>([]);
    const [categories, setCategories] = useState<{ repo_category: string; }[]>([]);
    const [category, setCategory] = useState<string>(`all`);

    useEffect(() => {
        (async () => {
            const topicsResponse = await axios.get(`${process.env.BACKEND_URL}/api/topics/${category}`);
            setRepositories(topicsResponse.data.data);

            const categoriesResponse = await axios.get(`${process.env.BACKEND_URL}/api/categories`);
            setCategories(categoriesResponse.data.data);
        })();
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
                    
                    <div className="flex flex-wrap items-start max-x-[59rem]">
                        {
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