'use client';

import { CopyIcon, EyeIcon, EyeOffIcon, MonitorIcon, ShieldCheckIcon, SmartphoneIcon, Trash2Icon, UserIcon } from 'lucide-react';

import DeviceDetector from 'device-detector-js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import 'moment/locale/ko';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogFooter, AlertDialogHeader, AlertDialogTrigger, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const SettingsSecure = () => {
    const [devices, setDevices] = useState<{ node_id: number; user_email: string; device_agent: string; updated_at: string; }[]>([]);
    const [type, setType] = useState<`password` | `text`>(`password`);
    const [accessToken, setAccessToken] = useState<string>(``);
    const [deviceAgent, setDeviceAgent] = useState<string>(``);
    const [password, setPassword] = useState<string>(``);
    const [device, setDevice] = useState<any>();

    const { toast } = useToast();
    const router = useRouter();
    const userData = useUser();

    if (!userData) router.push(`/`);

    useEffect(() => {
        setAccessToken(localStorage.getItem(`accessToken`) || ``);

        (async () => {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/devices`, { accessToken: localStorage.getItem(`accessToken`) });
            if (response.data.status === 200) setDevices(response.data.data);
        })();
    }, []);

    const handlePasswordSubmit = async () => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/user/modify/password`, { user_password: password, user_email: userData?.user_email, accessToken: localStorage.getItem(`accessToken`) || `` });

        if (response.data.status === 200) {
            setTimeout(() => {
                router.push(`/settings/secure`);
                window.location.replace(`/settings/secure`);
            }, 500);
        }

        toast({ title: response.data.message });
    }

    const handleDeviceRemove = async () => {
        const responseRemove = await axios.post(`${process.env.BACKEND_URL}/api/user/device/remove`, { accessToken: localStorage.getItem(`accessToken`), agent: deviceAgent });
        if (responseRemove.data.status === 200) {
            const responseDevices = await axios.post(`${process.env.BACKEND_URL}/api/user/devices`, { accessToken: localStorage.getItem(`accessToken`) });
            if (responseDevices.data.status === 200) setDevices(responseDevices.data.data);
        }
    }

    return (
        <AlertDialog>
            <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
                <div className="mx-auto grid w-full max-w-6xl gap-2">
                    <h1 className="text-3xl font-semibold">설정</h1>
                </div>

                <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                    <nav className="grid gap-4 text-sm text-muted-foreground" x-chunk="dashboard-04-chunk-0">
                        <Link href="/settings/general" className="flex items-center"><UserIcon className="w-4 h-4 mr-1.5" /> 일반</Link>
                        <Link href="/settings/secure" className="font-semibold text-primary flex items-center"><ShieldCheckIcon className="w-4 h-4 mr-1.5" /> 보안</Link>
                    </nav>

                    <div className="grid gap-6">
                        <Card x-chunk="dashboard-04-chunk-1">
                            <CardHeader>
                                <CardTitle>비밀번호 변경</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <form>
                                    <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="비밀번호" />
                                </form>
                            </CardContent>

                            <CardFooter className="border-t px-6 py-4">
                                <Button onClick={handlePasswordSubmit}>저장</Button>
                            </CardFooter>
                        </Card>

                        <Card x-chunk="dashboard-04-chunk-1">
                            <CardHeader>
                                <CardTitle>액세스 토큰</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <div className="flex items-center">
                                    <Button onClick={() => type === `password` ? setType(`text`) : setType(`password`)} className="mr-3" size="icon" variant="outline">{type === `password` ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</Button>
                                    <Input className="w-[20rem]" type={type} placeholder="token" value={accessToken} readOnly />
                                    <Button size="icon" className="ml-3" onClick={() => window.navigator.clipboard.writeText(accessToken)}><CopyIcon className="w-4 h-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card x-chunk="dashboard-04-chunk-1">
                            <CardHeader>
                                <CardTitle>연결된 기기</CardTitle>
                            </CardHeader>

                            <CardContent className="flex flex-wrap">
                                {
                                    devices.map(e => {
                                        const e_ = (new DeviceDetector()).parse(e.device_agent);
                                    
                                        return (
                                            <Card key={e.node_id} className={`w-[48%] even:ml-4 mb-4 group ${navigator.userAgent === e.device_agent && `border-black`}`}>
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            {e_.device?.brand && <Badge className="rounded-none rounded-l-md">{e_.device?.brand}</Badge>}
                                                            <Badge className="rounded-none rounded-r-md" variant="outline">{e_.client?.name}</Badge>
                                                        </div>
                                                        
                                                        <div>
                                                            {e_.device?.type === `desktop` ? <MonitorIcon className="w-4 h-4" /> : <SmartphoneIcon className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                
                                                    <p className="mt-3 text-lg"><b>{e_.os?.name} @{e_.os?.version}</b></p>
                                                </CardContent>

                                                <CardFooter className="p-4 flex justify-between items-center">
                                                    <Badge variant="secondary">{moment(e.updated_at).fromNow()}</Badge>

                                                    <AlertDialogTrigger asChild>
                                                        <Button onClick={() => {setDevice(e_); setDeviceAgent(e.device_agent);}} className="hidden group-hover:block w-5 h-5 p-1" variant="destructive" size="icon"><Trash2Icon className="w-3 h-3" /></Button>
                                                    </AlertDialogTrigger>
                                                </CardFooter>
                                            </Card>
                                        );
                                    })
                                }
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>({device?.os?.name} @{device?.os?.version}) 정말 이 기기를 지우시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        기기를 지우게되면 다시 로그인하는데에 까다로움을 겪을 수 있습니다.<br />
                        그래도 계속하시겠습니까?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeviceRemove}>계속</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default SettingsSecure;