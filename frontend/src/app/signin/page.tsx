'use client';

import { TicketIcon } from 'lucide-react';

import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Novatrix } from 'uvcanvas';
import Link from 'next/link';
import dotenv from 'dotenv';
import axios from 'axios';

import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

dotenv.config();

const SignIn = (): JSX.Element => {
    const { toast } = useToast();
    const router = useRouter();

    const [password, setPassword] = useState<string>(``);
    const [submit, setSubmit] = useState<boolean>(false);
    const [email, setEmail] = useState<string>(``);
    const [code, setCode] = useState<string>(``);

    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setEmail(event.currentTarget.value);
    }

    const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.currentTarget.value);
    }

    const handleSubmit = async (): Promise<void> => {
        const emailRegexp = /([a-z0-9-]+)\@([a-z-]+)\.([a-z-.]+){2}/;

        if (emailRegexp.test(email) && password.length >= 8) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/v1/user/signin`, { user_email: email, user_password: password });

            if (response.data.status === 200) setSubmit(true);
            toast({ title: response.data.message });
        }
    }

    const handleSignIn = async (): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/v1/user/otp`, { user_email: email, code });

        if (response.data.status === 200) {
            const accessToken = response.data.data.accessToken;
            localStorage.setItem(`accessToken`, accessToken);

            setTimeout(() => {
                router.push(`/`);
                window.location.replace(`/`);
            }, 500);
        }

        toast({ title: response.data.message });
    }

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 h-[calc(100dvh_-_4.5rem)] overflow-hidden">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">⌥ 로그인</h1>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">이메일</Label>
                            <Input id="email" type="email" placeholder="m@example.com" required defaultValue={email} onChange={handleEmailChange} disabled={submit} />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">비밀번호</Label>
                                <Link href="#" className="ml-auto inline-block text-sm underline">비밀번호 찾기</Link>
                            </div>

                            <Input id="password" type="password" required defaultValue={password} onChange={handlePasswordChange} disabled={submit} />
                        </div>

                        {
                            submit &&
                            <InputOTP maxLength={4} defaultValue={code} onChange={value => setCode(value)} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                </InputOTPGroup>
                            </InputOTP>
                        }

                        {
                            !submit ?
                            <Button className="w-full" onClick={handleSubmit}><TicketIcon className="mr-2 h-4 w-4" /> 2차 인증</Button>
                            :
                            <Button className="w-full" onClick={handleSignIn}><TicketIcon className="mr-2 h-4 w-4" /> 로그인</Button>
                        }
                    </div>

                    <div className="mt-4 text-center text-sm">
                        계정이 존재하지 않습니까?{" "}
                        <Link href="/signup" className="underline">회원가입</Link>
                    </div>
                </div>
            </div>

            <div className="hidden bg-muted lg:block">
                <Novatrix />
            </div>
        </div>
    );
}

export default SignIn;