'use client';

import { CheckIcon, ChevronLeft, PlusCircle, Trash2Icon, Upload, XIcon } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import axios from 'axios';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/components/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { IRepository } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const CreateRepository = (props: any): JSX.Element => {
    const [repository, setRepository] = useState<IRepository>();

    const [visibility, setVisibility] = useState<`public` | `private`>(`public`);
    const [description, setDescription] = useState<string>(``);
    const [subCategory, setSubCategory] = useState<string>(``);
    const [archive, setArchive] = useState<boolean>(false);
    const [license, setLicense] = useState<string>(`MIT`);
    const [category, setCategory] = useState<string>(``);
    const [image, setImage] = useState<string>(``);
    const [name, setName] = useState<string>(``);

    const [grantes, setGrantes] = useState<{ user_email: string; type: string; }[]>([]);
    const grantEmail = useRef(null);

    const { toast } = useToast();
    const router = useRouter();
    const userData = useUser();
    const file = useRef(null);

    if (!userData) router.push(`/`);

    useEffect(() => {
        (async () => {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}`);

            if (response.data.status === 200) {
                const data = response.data.data;
                setRepository(data);

                if (data?.repo_visibility) setVisibility(data.repo_visibility === 1 ? `public` : `private`);
                if (data?.repo_description) setDescription(data.repo_description);
                if (data?.repo_subcategory) setSubCategory(data.repo_subcategory);
                if (data?.repo_archive) setArchive(data.repo_archive === 1);
                if (data?.repo_license) setLicense(data.repo_license);
                if (data?.repo_category) setCategory(data.repo_category);
                if (data?.image_src) setImage(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/topic_image`);
                if (data?.repo_name) setName(data.repo_name);
                if (data?.repo_grantes) setGrantes(data.repo_grantes.reduce((pre: [], cur: { target_email: any; authority_type: any; }) => [...pre, { user_email: cur.target_email, type: cur.authority_type }], []));
            }
        })();
    }, [props.params.node_id]);

    const handleSubmit = async (): Promise<void> => {
        const fileCurrent: any = file.current;

        if (name.trim() !== `` && name.length <= 20 && description.length <= 100 && category.trim() !== ``) {
            const formdata = new FormData();

            if (fileCurrent) formdata.append(`image`, fileCurrent.files[0]);

            formdata.append(`node_id`, props.params.node_id);
            formdata.append(`user_email`, userData?.user_email || ``);
            formdata.append(`repo_name`, name);
            formdata.append(`repo_description`, description);
            formdata.append(`repo_grantes`, JSON.stringify(grantes));
            formdata.append(`repo_category`, category);
            formdata.append(`repo_subcategory`, subCategory);
            formdata.append(`repo_visibility`, visibility === `public` ? `1` : `0`);
            formdata.append(`repo_archive`, archive ? `1` : `0`);
            formdata.append(`repo_license`, license);
            formdata.append(`accessToken`, localStorage.getItem(`accessToken`) || ``);

            const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/modify`, formdata, { headers: { 'Content-Type': `multipart/form-data` } });
            if (response.data.status === 200) {
                setTimeout(() => {
                    router.push(`/${userData?.user_email}`);
                    window.location.replace(`/${userData?.user_email}`);
                }, 500);
            }

            toast({ title: response.data.message });
        } else toast({ title: `레포지토리는 20자 이내로, 설명(선택)은 100자 이내로, 카테고리는 선택하였는지 다시 한번 확인해주세요.` });
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
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

    return (
        <>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 mt-10">
                <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => history.back()} variant="outline" size="icon" className="h-7 w-7">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">뒤로</span>
                        </Button>

                        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">레포지토리 수정</h1>
                        <Badge variant="outline" className="ml-auto sm:ml-0">newer</Badge>

                        <div className="hidden items-center gap-2 md:ml-auto md:flex">
                            <Button variant="outline" size="icon" onClick={() => history.back()}><XIcon className="w-4 h-4" /></Button>
                            <Button size="icon" onClick={handleSubmit}><CheckIcon className="w-4 h-4" /></Button>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                            <Card x-chunk="dashboard-07-chunk-0">
                                <CardHeader>
                                    <CardTitle>상세정보</CardTitle>
                                    <CardDescription>레포지토리를 만드는 것에 있어 이름 만큼은 꼭 필요합니다.</CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="name">이름 (*)</Label>
                                            <Input id="name" type="text" className="w-full" defaultValue={name} onChange={e => setName(e.target.value)} />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="description">설명</Label>
                                            <Textarea id="description" className="min-h-32" defaultValue={description} onChange={e => setDescription(e.target.value)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {
                                repository?.user_email === userData?.user_email &&
                                <Card x-chunk="dashboard-07-chunk-1">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            권한 부여
                                            <Badge className="ml-2">beta</Badge>
                                        </CardTitle>
    
                                        <CardDescription>유저에게 레포지토리 권한을 부여할 수 있습니다.</CardDescription>
                                    </CardHeader>
    
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>이메일</TableHead>
                                                    <TableHead className="w-[100px]">권한</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
    
                                            <TableBody>
                                                {
                                                    grantes.map((e, idx) =>
                                                        e.user_email !== userData?.user_email &&
                                                        <TableRow key={idx}>
                                                            <TableCell className="font-semibold">{e.user_email}</TableCell>
            
                                                            <TableCell>
                                                                <ToggleGroup type="single" value={e.type} variant="outline">
                                                                    <ToggleGroupItem value="admin" onClick={() => {
                                                                        grantes[idx].type = `admin`;
                                                                        setGrantes([...grantes]);
                                                                    }}>ADMIN</ToggleGroupItem>
                                                                    <ToggleGroupItem value="commit" onClick={() => {
                                                                        grantes[idx].type = `commit`;
                                                                        setGrantes([...grantes]);
                                                                    }}>COMMIT</ToggleGroupItem>
                                                                </ToggleGroup>
                                                            </TableCell>
                                                            
                                                            <TableCell>
                                                                <Button variant="destructive" onClick={() => {
                                                                    grantes.splice(idx, 1);
                                                                    setGrantes([...grantes]);
                                                                }}>
                                                                    <Trash2Icon className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                }
                                            </TableBody>
                                        </Table>
                                    </CardContent>
    
                                    <CardFooter className="justify-center border-t p-4">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="gap-1">
                                                    <PlusCircle className="h-3.5 w-3.5" />
                                                    유저 추가
                                                </Button>
                                            </DialogTrigger>
    
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>유저 추가</DialogTitle>
                                                    <DialogDescription></DialogDescription>
                                                </DialogHeader>
    
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="email" className="text-right">이메일</Label>
                                                        <Input ref={grantEmail} id="email" className="col-span-3" />
                                                    </div>
                                                </div>
    
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button type="submit" onClick={() => {
                                                            const current: any = grantEmail.current;
                                                            if (current) setGrantes([...grantes, { user_email: current.value, type: `commit` }]);
                                                        }}>추가</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardFooter>
                                </Card>
                            }

                            <Card x-chunk="dashboard-07-chunk-2">
                                <CardHeader>
                                    <CardTitle>카테고리 추가</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-6 sm:grid-cols-3">
                                        <div className="grid gap-3">
                                            <Label htmlFor="category">카테고리 (*)</Label>

                                            <Select defaultValue={category} onValueChange={e => setCategory(e)}>
                                                <SelectTrigger id="category" aria-label="Select category">
                                                    <SelectValue placeholder="카테고리 선택" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="React">React</SelectItem>
                                                    <SelectItem value="Next">Next</SelectItem>
                                                    <SelectItem value="Svelte">Svelte</SelectItem>
                                                    <SelectItem value="Vue">Vue</SelectItem>
                                                    <SelectItem value="Angular">Angular</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="subcategory">서브 카테고리 (옵션)</Label>

                                            <Select defaultValue={subCategory} onValueChange={e => setSubCategory(e)}>
                                                <SelectTrigger id="subcategory" aria-label="Select subcategory">
                                                    <SelectValue placeholder="카테고리 선택" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="webpack">WebPack</SelectItem>
                                                    <SelectItem value="nodejs">Node.js</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                            <Card x-chunk="dashboard-07-chunk-3">
                                <CardHeader>
                                    <CardTitle>공개 여부</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="status">공개 / 비공개 (*)</Label>

                                            <Select defaultValue={visibility} onValueChange={(e: `public` | `private`) => setVisibility(e)}>
                                                <SelectTrigger id="status" aria-label="Select status">
                                                    <SelectValue placeholder="공개 여부 선택" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="public">공개</SelectItem>
                                                    <SelectItem value="private">비공개</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden" x-chunk="dashboard-07-chunk-4">
                                <CardHeader>
                                    <CardTitle>토픽 이미지</CardTitle>
                                    <CardDescription>토픽 이미지를 등록하면 보는사람들이 내 레포지토리의 목적이 무엇인지 확인할 수 있습니다.</CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <input ref={file} onChange={handleImageChange} type="file" id="topic_image" hidden accept="image/*" />

                                            <label htmlFor="topic_image" className="flex aspect-square w-max items-center justify-center rounded-md border border-dashed h-60">
                                                {
                                                    image ?
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img className="w-full h-full object-contain" src={image} alt="repo_topic_image" />
                                                    :
                                                    <>
                                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                                        <span className="sr-only">업로드</span>
                                                    </>
                                                }
                                            </label>

                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card x-chunk="dashboard-07-chunk-3">
                                <CardHeader>
                                    <CardTitle>라이선스</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="status">라이선스 선택 (*)</Label>

                                            <Select defaultValue={license} onValueChange={e => setLicense(e)}>
                                                <SelectTrigger id="status" aria-label="Select status">
                                                    <SelectValue placeholder="라이선스 선택" />
                                                </SelectTrigger>

                                                <SelectContent>
                                                    <SelectItem value="MIT">MIT License</SelectItem>
                                                    <SelectItem value="Apache 2.0">Apache License 2.0</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card x-chunk="dashboard-07-chunk-5">
                                <CardHeader>
                                    <CardTitle>아카이브</CardTitle>
                                    <CardDescription>이 버튼을 눌러 공개 / 비공개 여부를 따지지 않고 아무도 볼 수 없게 아카이브로 이동시킵니다.</CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div></div>
                                    <Button size="sm" variant="secondary" onClick={() => setArchive(true)}>아카이브</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 md:hidden">
                        <Button variant="outline" size="sm" onClick={() => history.back()}>취소</Button>
                        <Button size="sm" onClick={handleSubmit}>레포지토리 수정</Button>
                    </div>
                </div>
            </main>
        </>
    );
}

export default CreateRepository;