import { BellIcon, BookIcon, BookPlusIcon, CheckIcon, MoonIcon, ScrollIcon, SunIcon, UserIcon } from 'lucide-react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import dotenv from 'dotenv';
import axios from 'axios';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { CardHeader, CardContent, CardFooter, CardTitle, CardDescription, } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toaster } from '@/components/ui/toaster';
import { Popover } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import logo from '../../public/old_logo.png';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Children = ({ children, }: Readonly<{ children: React.ReactNode; }>) => {
    const userData = useUser();
    const router = useRouter();

    // const { setTheme } = useTheme();

    if (typeof window !== `undefined` && `Notification` in window) {
        if (Notification.permission === `default` || Notification.permission === `granted`)
        Notification.requestPermission().then(permission => {
            if (permission === `granted`) console.log(`알림이 허용되었습니다.`);
        });
    }

    const [open, setOpen] = useState<boolean>(false);
    const [alerts, setAlerts] = useState<{ node_id: number; alert_title: string; alert_content: string; alert_read: boolean; alert_link: string; }[]>([]);

    useEffect(() => {
        (async () => {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/alerts`, { accessToken: localStorage.getItem(`accessToken`) });
            if (response.data.status === 200) setAlerts(response.data.data);
        })();

        setInterval(async () => {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/alerts`, { accessToken: localStorage.getItem(`accessToken`) });

            if (response.data.status === 200) {
                const data = response.data.data;
                
                if (data.filter((e: any) => !e.alert_read).length > 0) {
                    if (Notification.permission === `granted`) {
                        data.filter((e: any) => !e.alert_read).forEach((e: any) => {
                            const i = localStorage.getItem(`alerts`) ? JSON.parse(localStorage.getItem(`alerts`) as any) : null;

                            if (!i) localStorage.setItem(`alerts`, `[]`);
                            if (i && Array.isArray(i) && !i.includes(e.node_id)) {
                                new Notification(e.alert_title, { body: e.alert_content, icon: `/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fold_logo.8a275b06.png&w=2048&q=75` });

                                i.push(e.node_id);
                                localStorage.setItem(`alerts`, JSON.stringify(i));
                            }
                        });
                    }
                }

                setAlerts(data);
            }
        }, 10000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    useEffect((): () => void => {
        const down = (e: KeyboardEvent): void => {
            if (e.key === `j` && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(open => !open);
            }
        }
    
        document.addEventListener(`keydown`, down);
        return (): void => document.removeEventListener(`keydown`, down);
    }, []);

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="리포지토리 또는 유저 검색..." />

                <CommandList>
                    <CommandEmpty>검색된 데이터 없음.</CommandEmpty>

                    <CommandGroup heading="리포지토리">
                        <CommandItem>
                            <BookIcon className="mr-2 h-2 w-2" />
                            <span>고서온 / nextjs-master</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="유저">
                        <CommandItem>
                            <UserIcon className="mr-2 h-2 w-2" />
                            <span>고서온</span>
                        </CommandItem>

                        <CommandItem>
                            <UserIcon className="mr-2 h-2 w-2" />
                            <span>서온 고</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>

            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <div className="flex flex-col sm:gap-4 sm:py-4 h-full">
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        <Breadcrumb className="hidden md:flex">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/"><Image className="w-10 h-10 rounded-md" src={logo} alt="logo" /></Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="relative ml-auto flex-1 md:grow-0 flex items-center" onClick={() => setOpen(open => !open)}>
                            <button className="inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64">
                                <span className="hidden lg:inline-flex">리포지토리 또는 유저 검색...</span>
                                <span className="inline-flex lg:hidden">검색...</span>

                                <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                    <span className="text-xs">⌘</span>J
                                </kbd>
                            </button>
                        </div>

                        {/* <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">테마 변경</span>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme(`light`)}>화이트</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme(`dark`)}>다크</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme(`system`)}>시스템 설정</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu> */}

                        <Button onClick={() => router.push(`/repositories/topic`)} variant="outline"><ScrollIcon className="w-4 h-4 mr-2" /> 토픽</Button>

                        {
                            userData ?
                            <>
                                <Button onClick={() => router.push(`/repositories/create`)} variant="outline" size="icon"><BookPlusIcon className="w-4 h-4" /></Button>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <BellIcon className="w-4 h-4" />
                                            {alerts.find(e => !e.alert_read) && <span className="w-[5px] h-[5px] rounded-full bg-blue-600 absolute mt-[15px] ml-[15px]"></span>}
                                        </Button>
                                    </PopoverTrigger>

                                    <PopoverContent className="w-[380px] px-0 py-0 mr-5 mt-5">
                                        <CardHeader>
                                            <CardTitle>알림</CardTitle>
                                            <CardDescription>{alerts.filter(e => !e.alert_read).length}개의 읽지 않은 메시지</CardDescription>
                                        </CardHeader>

                                        <CardContent className="grid gap-4">
                                            <div className=" flex items-center space-x-4 rounded-md border p-4">
                                                <BellIcon />

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-medium leading-none">알림 수신</p>
                                                        <Badge className="ml-2 px-2 py-0.5">beta</Badge>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">알림을 사용중인 디바이스로 전송합니다.</p>
                                                </div>

                                                <Switch />
                                            </div>

                                            <div>
                                                {
                                                    alerts.map(alert => (
                                                        <div onClick={async () => {
                                                            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/alert`, { accessToken: localStorage.getItem(`accessToken`), ids: [alert.node_id] });
                                                            if (response.data.status === 200) {
                                                                alert.alert_read = true;
                                                                setAlerts([...alerts]);
                                                                router.push(alert.alert_link || `#`);
                                                            }
                                                        }} key={alert.node_id} className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 cursor-pointer">
                                                            {!alert.alert_read ? <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" /> : <div className="w-2 h-2"></div>}

                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium leading-5">{alert.alert_title}</p>
                                                                <p className="text-sm text-muted-foreground">{alert.alert_content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </CardContent>

                                        <CardFooter>
                                            <Button onClick={async () => {
                                                const response = await axios.post(`${process.env.BACKEND_URL}/api/user/alert`, { accessToken: localStorage.getItem(`accessToken`), ids: alerts.reduce((pre, cur) => [...pre, cur.node_id], [] as number[]) });
                                                if (response.data.status === 200) {
                                                    alerts.map(e => e.alert_read = true);
                                                    setAlerts([...alerts]);
                                                }
                                            }} type="submit" className="w-full">
                                                <CheckIcon className="mr-2 h-4 w-4" /> 모두 읽음 처리
                                            </Button>
                                        </CardFooter>
                                    </PopoverContent>
                                </Popover>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                            {
                                                userData.avatar_src ?
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={`${process.env.BACKEND_URL}/api/${userData?.user_email}/avatar`} alt="Avatar" className="overflow-hidden rounded-full w-full h-full object-cover w-[36px] h-[36px]" />
                                                :
                                                <Image src="https://www.npmjs.com/npm-avatar/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdmF0YXJVUkwiOiJodHRwczovL3MuZ3JhdmF0YXIuY29tL2F2YXRhci8zODMwNTNhZDE0ZTAxZWRmNjk1MzQ4MDI1NjRjMzVlZT9zaXplPTQ5NiZkZWZhdWx0PXJldHJvIn0.JcJNScgZ-HpL8xyHe2h78_DA3A0Eoke_HzeqTwYGWcs" width={36} height={36} alt="Avatar" className="overflow-hidden rounded-full w-full h-full object-cover"/>
                                            }
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{userData.user_name || userData?.user_email}</DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={() => router.push(`/${userData?.user_email}`)}>내 정보</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/settings/general`)}>설정</DropdownMenuItem>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem onClick={() => {
                                            localStorage.removeItem(`accessToken`);
                                            location.href = `/`;
                                        }}>로그아웃</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                            :
                            <Button onClick={() => router.push(`/signin`)}>로그인</Button>
                        }
                    </header>

                    {children}
                </div>
            </div>

            {/* <Toaster /> */}
        </>
    )
}

export default Children;