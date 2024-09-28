import { useState, useEffect } from 'react';
// import { useQuery } from 'react-query';
import dotenv from 'dotenv';
import axios from 'axios';

import { IUser } from '@/interfaces/interfaces';

dotenv.config();

export const useUser = (): IUser => {
    // const { data } = useQuery(`user`, async () => {
    //     const accessToken = localStorage.getItem(`accessToken`);
    //     const response = await axios.post(`${process.env.BACKEND_URL}/api/v1/user/verify`, { accessToken });

    //     if (response.data.status === 200) return response.data.data;
    //     else return;
    // });

    // return data;
    
    const [userData, setUserData] = useState<IUser>({});

    useEffect(() => {
        (async (): Promise<void> => {
            const accessToken = localStorage.getItem(`accessToken`);
            const response = await axios.post(`${process.env.BACKEND_URL}/api/v1/user/verify`, { accessToken });
            
            setUserData(response.data.data);
            if (response.data.status !== 200) localStorage.removeItem(`accessToken`);
        })();
    }, []);

    return userData;
}