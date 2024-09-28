'use client';

import { TicketIcon, ZapIcon } from 'lucide-react';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Novatrix } from 'uvcanvas';
import Link from 'next/link';
import dotenv from 'dotenv';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/hooks/use-toast';

dotenv.config();

const SignUp = (): JSX.Element => {
    const { toast } = useToast();
    const router = useRouter();

    const [email, setEmail] = useState<string>(``);
    const [password, setPassword] = useState<string>(``);
    const [reenterPassword, setReenterPassword] = useState<string>(``);

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(event.currentTarget.value);
    }

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.currentTarget.value);
    }

    const handleReenterPasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setReenterPassword(event.currentTarget.value);
    }

    const handleSubmit = async (): Promise<void> => {
        const emailRegexp = /([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/;

        if (emailRegexp.test(email) && password.length >= 8 && reenterPassword.length >= 8 && password === reenterPassword) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/v1/user/signup`, { user_email: email, user_password: password });

            if (response.data.status === 200) {
                setTimeout(() => {
                    router.push(`/signin`);
                    window.location.replace(`/signin`);
                }, 500);
            }
            
            toast({ title: response.data.message });
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 h-dvh">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">⌥ 회원가입</h1>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input id="email" type="email" placeholder="m@example.com" required defaultValue={email} onChange={handleEmailChange} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">비밀번호</Label>
                            </div>

                            <Input id="password" type="password" required defaultValue={password} onChange={handlePasswordChange} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="reenterpassword">비밀번호 재입력</Label>
                            </div>

                            <Input id="reenterpassword" type="password" required defaultValue={reenterPassword} onChange={handleReenterPasswordChange} />
                        </div>

                        <Button className="w-full" onClick={handleSubmit}><TicketIcon className="mr-2 h-4 w-4" /> 2차 인증</Button>
                    </div>

                    <div className="mt-4 text-center text-sm">
                        이미 계정이 존재합니까?{" "}
                        <Link href="/signin" className="underline">로그인</Link>
                    </div>
                </div>
            </div>

            <div className="hidden bg-muted lg:block">
                <Novatrix />
            </div>
        </div>
    );
}

export default SignUp;