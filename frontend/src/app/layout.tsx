'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
// import { Metadata } from 'next';
import dotenv from 'dotenv';

import { ThemeProvider } from '@/components/theme-provider';

import { cn } from '@/lib/utils';
import '@/styles/shadcn-ui.css';

import Children from './children';

dotenv.config();

// export const metadata: Metadata = {
//     title: `kithub-inc`,
//     description: `킷허브`,
//     icons: { icon: `/resource/images/old_logo.png`}
// }

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
                    <link rel="shortcut icon" href="/old_logo.png" type="image/x-icon" />

                    <body className={cn(`min-h-screen bg-background font-sans antialiased`)}>
                        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                            <QueryClientProvider client={queryClient}>
                                <Children>
                                    {children}
                                </Children>
                            </QueryClientProvider>
                        </ThemeProvider>
                    </body>
                </html>
            }
        </>
    );
}