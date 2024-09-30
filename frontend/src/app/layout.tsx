'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { Suspense } from 'react';
import dotenv from 'dotenv';

import { ThemeProvider } from '@/components/theme-provider';

import { cn } from '@/lib/utils';
import '@/styles/shadcn-ui.css';

import Children from './children';

dotenv.config();

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>): JSX.Element {
    const queryClient = new QueryClient();
    
    // const [loaded, setLoaded] = useState<boolean>(false);
    // useEffect(() => setLoaded(true), []);

    return (
        <>
            {
                // loaded &&
                <html lang="en" suppressHydrationWarning>
                    <title>kithub-inc</title>
        
                    <body className={cn(`min-h-screen bg-background font-sans antialiased`)}>
                        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                            <Suspense fallback={<p>로딩 중...</p>}>
                                <QueryClientProvider client={queryClient}>
                                    <Children>
                                        {children}
                                    </Children>
                                </QueryClientProvider>
                            </Suspense>
                        </ThemeProvider>
                    </body>
                </html>
            }
        </>
    );
}