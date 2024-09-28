'use client';

import { ShieldCheckIcon, UploadIcon, UserIcon } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dotenv from 'dotenv';
import axios from 'axios';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const SettingsGeneral = () => {
    const [image, setImage] = useState<string>(``);
    const [name, setName] = useState<string>(``);

    const { toast } = useToast();
    const avatar = useRef(null);
    const userData = useUser();
    const router = useRouter();

    if (!userData) router.push(`/`);

    useEffect(() => {
        if (userData.avatar_src) setImage(`${process.env.BACKEND_URL}/api/${userData.user_email}/avatar`);
        setName(userData.user_name || ``);
    }, [userData]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                if (reader.readyState === 2) {
                    setImage(event.target?.result?.toString() || ``);
                }
            }
        }
    }

    const handleAvatarSubmit = async () => {
        const fileCurrent: any = avatar.current;

        const formdata = new FormData();

        if (fileCurrent && userData?.user_email) {
            formdata.append(`user_email`, userData?.user_email);
            formdata.append(`accessToken`, localStorage.getItem(`accessToken`) || ``);
            formdata.append(`image`, fileCurrent.files[0]);

            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/modify/avatar`, formdata, { headers: { 'Content-Type': `multipart/form-data` } });
            if (response.data.status === 200) {
                setTimeout(() => {
                    router.push(`/settings/general`);
                    window.location.replace(`/settings/general`);
                }, 500);
            }

            toast({ title: response.data.message });
        } else toast({ title: `이미지를 업로드 했는지 다시 확인해주세요.` });
    }

    const handleNameSubmit = async () => {
        const formdata = new FormData();

        if (userData?.user_email && name.trim() !== ``) {
            formdata.append(`user_email`, userData?.user_email);
            formdata.append(`accessToken`, localStorage.getItem(`accessToken`) || ``);
            formdata.append(`user_name`, name);

            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/modify/name`, formdata, { headers: { 'Content-Type': `multipart/form-data` } });
            if (response.data.status === 200) {
                setTimeout(() => {
                    router.push(`/settings/general`);
                    window.location.replace(`/settings/general`);
                }, 500);
            }

            toast({ title: response.data.message });
        } else toast({ title: `이름을 제대로 입력했는지 다시 확인해주세요.` });
    }

    return (
        <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
            <div className="mx-auto grid w-full max-w-6xl gap-2">
                <h1 className="text-3xl font-semibold">설정</h1>
            </div>

            <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
                <nav className="grid gap-4 text-sm text-muted-foreground" x-chunk="dashboard-04-chunk-0">
                    <Link href="/settings/general" className="font-semibold text-primary flex items-center"><UserIcon className="w-4 h-4 mr-1.5" /> 일반</Link>
                    <Link href="/settings/secure" className="flex items-center"><ShieldCheckIcon className="w-4 h-4 mr-1.5" /> 보안</Link>
                </nav>

                <div className="grid gap-6">
                    <Card x-chunk="dashboard-04-chunk-1">
                        <CardHeader>
                            <CardTitle>아바타 변경</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <form>
                                <input ref={avatar} onChange={handleAvatarChange} id="avatar" type="file" accept="image/*" hidden />

                                <label htmlFor="avatar" className="flex aspect-square w-20 h-20 items-center justify-center rounded-full border border-dashed overflow-hidden">
                                    {
                                        image ?
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img className="w-full h-full object-cover" src={image} alt="avatar" />
                                        :
                                        <>
                                            <UploadIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="sr-only">업로드</span>
                                        </>
                                    }
                                </label>
                            </form>
                        </CardContent>

                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleAvatarSubmit}>저장</Button>
                        </CardFooter>
                    </Card>

                    <Card x-chunk="dashboard-04-chunk-1">
                        <CardHeader>
                            <CardTitle>이름 변경</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <form>
                                <Input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="이름" />
                            </form>
                        </CardContent>

                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleNameSubmit}>저장</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </main>
    );
}

export default SettingsGeneral;