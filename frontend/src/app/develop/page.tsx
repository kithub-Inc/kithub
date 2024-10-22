'use client';

import { ChevronLeft } from 'lucide-react';

import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';

import { Button } from '@/components/ui/button';

import Canvas from '@/components/canvas';
import Editor from '@/components/editor';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Develop = (props: any): JSX.Element => {
    const router = useRouter();
    const { data: userData } = useUser();

    return (
        <>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mx-auto grid w-full md:max-w-[59rem] px-8 md:px-0 flex-1 auto-rows-max gap-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">뒤로</span>
                        </Button>

                        <h1 style={{ marginLeft: `-5px` }} className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 mt-1">디벨롭</h1>
                    </div>

                    <Canvas width={800} height={400} />
                    <Editor t={props.searchParams?.t || ``} />
                </div>
            </main>
        </>
    );
}

export default Develop;