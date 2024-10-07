'use client';

import { ChartNoAxesGanttIcon, ChevronLeft, Link2Icon } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import 'moment/locale/ko';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { IAlert } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const Alerts = (props: any): JSX.Element => {
    const router = useRouter();
    const userData = useUser();
    const [alerts, setAlerts] = useState<IAlert[]>([]);

    useEffect(() => {
        (async () => {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/user/alerts`, { accessToken: localStorage.getItem(`accessToken`) });
            if (response.data.status === 200) setAlerts(response.data.data);
        })();
    }, []);

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
            <div className="mx-auto grid w-full md:max-w-[59rem] px-8 md:px-0 flex-1 auto-rows-max gap-4">
                <div className="flex items-center gap-4">
                    <Button onClick={() => router.back()} variant="outline" size="icon" className="h-8 w-8 hover:bg-gray-200 transition">
                        <ChevronLeft className="h-5 w-5" />
                        <span className="sr-only">뒤로</span>
                    </Button>

                    <h1 className="flex-1 text-xl font-semibold tracking-tight">알림</h1>
                </div>

                {Array.from(new Set(alerts.reduce((pre, cur) => [...pre, moment(cur.created_at).format(`YYYY년 M월`)], [] as string[]))).map((month, idx) => (
                    <div key={idx}>
                        <p className="mt-6 mb-3 font-bold text-lg text-gray-700 flex items-center">
                            <ChartNoAxesGanttIcon className="w-4 h-4 mr-1.5 mb-1" />
                            {month}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {alerts.filter(e => moment(e.created_at).format(`YYYY년 M월`) === month).map(e => (
                                <Card key={e.node_id} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition">
                                    <CardHeader className="p-4 border-b">
                                        <div className="flex items-center">
                                            {!e.alert_read && <span className="mr-1.5 mb-0.5 w-[5px] h-[5px] rounded-full bg-blue-600"></span>}
                                            <h2 className="text-sm text-base font-semibold">{e.alert_title}</h2>
                                        </div>

                                        <p className="text-xs text-gray-500">{moment(e.created_at).fromNow()}</p>
                                    </CardHeader>

                                    <CardContent className="p-4 text-sm text-gray-600">
                                        {e.alert_content.length > 80 ? `${e.alert_content.substring(0, 80)}...` : e.alert_content}
                                    </CardContent>

                                    <CardFooter className="p-2 border-t">
                                        <Button onClick={() => router.push(e.alert_link)} variant="ghost" className="w-full text-sm">
                                            <Link2Icon className="w-4 h-4 mr-1.5" />
                                            바로가기
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export default Alerts;