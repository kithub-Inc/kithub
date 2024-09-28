'use client';

import { LinkIcon, WandSparklesIcon } from 'lucide-react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import logo from '../../public/logo.png';

import { useUser } from '@/components/hooks/use-user';

const Home = () => {
    const userData = useUser();
    const router = useRouter();
    
    return (
        <>
            <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mt-36 flex flex-col justify-center items-center text-white">
                    <div className="rounded-full mix-blend-difference border px-5 py-2 flex items-center shadow-sm">
                        <WandSparklesIcon className="w-3 h-3" />
                        <p className="mt-0.5 leading-none ml-2 mr-1" style={{ fontSize: `14px` }}>창의적인 어떤 것을 시도하고, 시작하고 싶습니까?</p>·
                        <Link className="mt-0.5 ml-1 underline" style={{ fontSize: `14px` }} href={userData ? `/repositories/create` : `/signin`}>바로가기</Link>
                    </div>

                    <Image className="mt-10" height="50" src={logo} alt="logo" />
                    {/* <h1 className="mix-blend-difference mt-10 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">킷허브: 한명의 풀스택 개발자</h1> */}
                    <h2 className="mix-blend-difference mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0 text-center">킷허브는, 깃허브와 비슷한 느낌의 클라우드 서비스 겸<br />리포지토리 호스팅 서비스 입니다.</h2>

                    <Button className="mt-10" onClick={() => userData ? router.push(`/repositories/topic`) : router.push(`/signin`)}>
                        <LinkIcon className="mr-2 h-4 w-4" /> 시작하기
                    </Button>

                    <br /><br /><br /><br /><br /><br />
                </div>
            </main>
        </>
    );
}

export default Home;