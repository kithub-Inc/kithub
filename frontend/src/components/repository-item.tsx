import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository } from '@/interfaces/interfaces';

const RepositoryItem = ({ e, bool }: { e: IRepository, bool?: boolean }): JSX.Element => {
    const router = useRouter();
    
    return (
        <Card className={`flex flex-col justify-between w-full ${e.image_src ? `row-span-2` : `row-span-1`}`}>
            <CardHeader>
                <CardTitle>
                    {
                        e.image_src &&
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="w-72 mb-5" src={e.image_src} alt="repo_image" />
                    }

                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            {!bool && <span className="text-xs text-slate-400">{e.user_name || e.user_email}</span>}
                            <span className="mt-1 !leading-5">{e.repo_name}</span>
                        </div>

                        <div className="flex items-center max-w-[80px] overflow-hidden relative">
                            <Badge variant="outline">
                                {e.repo_category}
                                <span className="absolute"></span>
                            </Badge>

                            {e.repo_subcategory && <Badge className="ml-2" variant="outline">{e.repo_subcategory}</Badge>}
                            {e.repo_subcategory && <div className="absolute top-0 right-0 w-[40px] h-full bg-gradient-to-r from-transparent to-white"></div>}
                        </div>
                    </div>
                </CardTitle>

                <CardDescription className="pt-2">{e.repo_description}</CardDescription>
            </CardHeader>

            <CardContent className="flex items-center justify-between">
                <Button onClick={() => router.push(`/repositories/${e.node_id}`)} size="sm" variant="secondary">자세히 보기</Button>

                <div className="flex items-center gap-2">
                    {e.repo_visibility === 0 && <Badge variant="destructive">private</Badge>}
                    {e.repo_type === `forked` && <Badge>forked</Badge>}
                </div>
            </CardContent>
        </Card>
    );
}

export default RepositoryItem;