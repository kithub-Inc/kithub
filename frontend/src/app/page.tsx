/* eslint-disable @next/next/no-img-element */

'use client';

import { ChartPieIcon, FileClockIcon, LinkIcon, MessageSquareDiffIcon, PlusIcon, WandSparklesIcon, ZapIcon, TrendingUpIcon, UserRoundPlusIcon, CornerDownRight, FolderGitIcon } from 'lucide-react';

import { Label, Pie, PieChart } from 'recharts';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dotenv from 'dotenv';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import logo from '../../public/logo.png';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Home = () => {
    const userData = useUser();
    const router = useRouter();

    const chartData = [
        { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
        { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
        { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
        { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
        { browser: "other", visitors: 190, fill: "var(--color-other)" }
    ];

    const chartConfig = {
        chrome: { label: "Chrome", color: "hsl(var(--chart-1))" },
        safari: { label: "Safari", color: "hsl(var(--chart-2))" },
        firefox: { label: "Firefox", color: "hsl(var(--chart-3))" },
        edge: { label: "Edge", color: "hsl(var(--chart-4))" },
        other: { label: "Other", color: "hsl(var(--chart-5))" }
    } satisfies ChartConfig;

    const totalVisitors = useMemo(() => {
        return chartData.reduce((acc, curr) => acc + curr.visitors, 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    return (
        <>
            <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                {
                    userData ?
                    <>
                        <div className="relative">
                            <p className="text-lg flex items-center rounded-lg p-4 sticky top-[20px] backdrop-blur-3xl z-30"><ZapIcon className="w-4 h-4 mr-1.5 mb-0.5" /><span className="font-bold">킷허브</span>의 새 소식</p>

                            <div className="pl-4">
                                <Card>
                                    <CardHeader className="p-6 pb-0">
                                        <div className="flex flex-row items-center justify-start">
                                            <Badge><MessageSquareDiffIcon className="mr-1 w-3 h-3" /> 패치노트</Badge>
                                            <Badge variant="outline" className="ml-2 !my-0">@4.2.0</Badge>
                                        </div>

                                        <p className="!mt-3">가벼운 업데이트 안내</p>
                                    </CardHeader>

                                    <CardContent className="p-6 py-4 relative">
                                        <p className="text-sm leading-6">
                                            안녕하세요 킷허브 CEO 고서온이라고 합니다.<br />
                                            이번에 4.2.0 버전으로 업데이트를 마쳤...
                                        </p>

                                        <div className="absolute top-[40px] left-[150px] bg-gradient-to-r from-transparent to-white w-[100px] h-[20px]"></div>
                                    </CardContent>

                                    <CardFooter className="p-6 pt-0">
                                        <Button size="sm" variant="outline">
                                            <PlusIcon className="w-3 h-3 mr-1" /> 더보기
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>

                        <div className="relative mt-10">
                            <p className="text-lg flex items-center rounded-lg p-4 sticky top-[20px] backdrop-blur-3xl z-30"><FileClockIcon className="w-4 h-4 mr-1.5 mb-0.5" /><span className="font-bold mr-1">킷허브</span> 유저 활동 기록</p>

                            <div className="flex flex-wrap pl-4">
                                {
                                    Array(6).fill(0).map((_, idx) =>
                                        <Card key={idx} className="mr-6 mb-6">
                                            <CardHeader className="p-6 pb-0">
                                                <p className="flex items-center">
                                                    <img className="w-5 h-5 rounded-full" src={`${process.env.BACKEND_URL}/api/${userData.user_email}/avatar`} alt="avatar" />
                                                    <span className="ml-2 font-bold mt-0.5">{userData.user_name || userData.user_email}</span>님
                                                </p>
                                            </CardHeader>
        
                                            <CardContent className="p-6 py-4 mr-5">
                                                <div className="flex items-center mb-2">
                                                    <UserRoundPlusIcon className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">팔로잉</span>
                                                    <CornerDownRight className="w-3 h-3 mx-2" />
                                                    <span className="text-blue-900 text-sm border-b-[1px] leading-none border-blue-900 border-neutral-950 cursor-pointer">@ice2</span>
                                                </div>
        
                                                <div className="flex items-center">
                                                    <FolderGitIcon className="w-4 h-4 mr-2" />
                                                    <span className="text-sm">레포 생성</span>
                                                    <CornerDownRight className="w-3 h-3 mx-2" />
                                                    <span className="text-blue-900 text-sm border-b-[1px] leading-none border-blue-900 border-neutral-950 cursor-pointer">@ICe1BotMaker/asdf</span>
                                                </div>
                                            </CardContent>
        
                                            <CardFooter className="p-6 pt-4 flex">
                                                <Button size="sm" variant="outline">
                                                    <PlusIcon className="w-3 h-3 mr-1" /> 더보기
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    )
                                }
                            </div>
                        </div>

                        <div className="relative mt-10">
                            <p className="text-lg flex items-center rounded-lg p-4 sticky top-[20px] backdrop-blur-3xl z-30"><ChartPieIcon className="w-4 h-4 mr-1.5 mb-0.5" /><span className="font-bold mr-1">킷허브</span> 차트</p>
                            
                            <div className="pl-4">
                                <Card className="flex flex-col w-[275px]">
                                    <CardHeader className="items-center pb-0">
                                        <CardTitle>킷허브 방문자 수</CardTitle>
                                        <CardDescription>2024년 9월 기준</CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-1 pb-0">
                                        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
                                                    <Label content={({ viewBox }) => {
                                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                            return (
                                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">{totalVisitors.toLocaleString()}</tspan>
                                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">방문자</tspan>
                                                                </text>
                                                            )
                                                        }
                                                        }}
                                                    />
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                    </CardContent>

                                    <CardFooter className="flex-col gap-2 text-sm">
                                        <div className="flex items-center gap-2 font-medium leading-none">
                                            저번보다 200% 증가했어요! <TrendingUpIcon className="h-4 w-4" />
                                        </div>

                                        <div className="leading-none text-muted-foreground">
                                            3개월 단위로 계산됨
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>

                        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                        <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
                    </>
                    :
                    <>
                        <div className="mt-36 flex flex-col justify-center items-center text-white">
                            <div className="rounded-full mix-blend-difference border px-5 py-2 flex items-center shadow-sm">
                                <WandSparklesIcon className="w-3 h-3" />
                                <p className="mt-0.5 leading-none ml-2 mr-1" style={{ fontSize: `14px` }}>창의적인 어떤 것을 시도하고, 시작하고 싶습니까?</p>·
                                <Link className="mt-0.5 ml-1 underline" style={{ fontSize: `14px` }} href={userData ? `/repositories/create` : `/signin`}>바로가기</Link>
                            </div>
        
                            <Image className="mt-10" height="50" src={logo} alt="logo" />
                            {/* <h1 className="mix-blend-difference mt-10 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">킷허브: 한명의 풀스택 개발자</h1> */}
                            <h2 className="mix-blend-difference mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0 text-center">킷허브는, 깃허브와 비슷한 느낌의 클라우드 서비스 겸<br />레포지토리 호스팅 서비스 입니다.</h2>
        
                            <Button className="mt-10" onClick={() => userData ? router.push(`/repositories/topic`) : router.push(`/signin`)}>
                                <LinkIcon className="h-4 w-4" />
                                <Separator className="mx-3" orientation="vertical" />
                                시작하기
                            </Button>
        
                            <br /><br /><br /><br /><br /><br />
                        </div>
                    </>
                }
            </main>
        </>
    );
}

export default Home;