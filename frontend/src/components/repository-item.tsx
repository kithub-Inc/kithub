import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { IRepository } from '@/interfaces/interfaces';

const RepositoryItem = ({ e, bool }: { e: IRepository, bool?: boolean }): JSX.Element => {
    const router = useRouter();
    
    return (
        <Card className="mr-5 mb-5 w-full md:w-72">
            <CardHeader>
                <CardTitle>
                    {
                        e.image_src &&
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="w-72 mb-5" src={`${process.env.BACKEND_URL}/api/repository/${e.node_id}/topic_image`} alt="repo_image" />
                    }

                    <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                            {!bool && <span className="text-xs text-slate-400">{e.user_name || e.user_email}</span>}
                            <span className="mt-1">{e.repo_name}</span>
                        </div>

                        <div>
                            <Badge variant="outline">
                                {e.repo_category}
                                <span className="absolute"></span>
                            </Badge>

                            {e.repo_subcategory && <Badge className="ml-2" variant="outline">{e.repo_subcategory}</Badge>}
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