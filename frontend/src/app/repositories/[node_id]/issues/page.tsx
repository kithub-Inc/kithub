'use client';

import { AntennaIcon, BugIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { CaretSortIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dotenv from 'dotenv';
import moment from 'moment';
import axios from 'axios';

import 'moment/locale/ko';

import { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

import RepositoryProvider from '@/components/repository-provider';

import { IIssue, IProps, IRepository } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const RepositoryIssues = (props: any) => {
    const { toast } = useToast();
    const router = useRouter();
    const userData = useUser();

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [repository, setRepository] = useState<IRepository>();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [data, setData] = useState<IIssue[]>([]);

    const content = useRef<any>(null);
    const title = useRef<any>(null);

    const columns: ColumnDef<IIssue>[] = [
        {
            id: `select`,
            header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && `indeterminate`)} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
            cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
            enableSorting: false,
            enableHiding: false
        },
        {
            accessorKey: `issue_status`,
            header: `상태`,
            cell: ({ row }) => {
                const value: string = row.getValue(`issue_status`);

                return <div className="capitalize">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" className="!h-[22px] flex items-center" style={{ fontSize: `12px` }} variant={value === `대기` ? `secondary` : (value === `진행중` ? `outline` : (value === `성공` ? `default` : `destructive`))}>{value}</Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[175px]">
                            {
                                userData?.user_email === repository?.user_email &&
                                <Select onValueChange={e => handleStatusChange(data[row.index].node_id, e)()}>
                                    <SelectTrigger className="w-full">
                                        <div className="flex items-center">
                                            <AntennaIcon className="w-4 h-4 mr-2" />
                                            <SelectValue placeholder="(선택)" />
                                        </div>
                                    </SelectTrigger>
    
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>모든 상태</SelectLabel>
    
                                            <SelectItem value="대기">대기</SelectItem>
                                            <SelectItem value="진행중">진행중</SelectItem>
                                            <SelectItem value="성공">성공</SelectItem>
                                            <SelectItem value="실패">실패</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            }
                        </PopoverContent>
                    </Popover>
                </div>;
            }
        },
        {
            accessorKey: `created_at`,
            header: `날짜`,
            cell: ({ row }) => <div className="capitalize">
                <Badge variant="default">{moment(row.getValue(`created_at`)).fromNow()}</Badge>
            </div>
        },
        {
            accessorKey: `user_email`,
            header: ({ column }) => 
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === `asc`)}>
                    유저
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button>,
            cell: ({ row }) => <div className="lowercase cursor-pointer" onClick={() => router.push(`/${row.getValue(`user_email`)}`)}>{row.getValue(`user_email`)}</div>
        },
        {
            accessorKey: `issue_title`,
            header: ({ column }) => 
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === `asc`)}>
                    제목
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button>,
            cell: ({ row }) => <div className="text-right font-medium">{row.getValue(`issue_title`)}</div>
        },
        {
            id: `actions`,
            enableHiding: false,
            cell: ({ row }) => {
                const origin = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">메뉴 열기</span>
                                <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>액션</DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={() => router.push(`/repositories/${props.params.node_id}/issues/${origin.node_id}`)}>자세히 보기</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${origin.user_email}`)}>작성자 보기</DropdownMenuItem>
                            {
                                userData &&
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>신고</DropdownMenuItem>
                                    {
                                        userData?.user_email === origin?.user_email &&
                                        <DropdownMenuItem onClick={() => handleIssueRemoveSubmit(origin.node_id)}>삭제</DropdownMenuItem>
                                    }
                                </>
                            }
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        }
    ];

    useEffect(() => {
        (async () => {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issues`);
            if (response.data.status === 200) setData(response.data.data);

            const responseRepository = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}`);
            if (responseRepository.data.status === 200) setRepository(responseRepository.data.data);
        })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection
        }
    });

    const handleIssueSubmit = async (): Promise<void> => {
        if (title.current && content.current) {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issue/create`, { accessToken: localStorage.getItem(`accessToken`), issue_title: title.current.value, issue_content: content.current.value });
            if (response.data.status === 200) location.reload();
            
            toast({ title: response.data.message });
        }
    }

    const handleStatusChange = (node_id: number, value: string) => {
        return async () => {
            const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issue/${node_id}/status`, { accessToken: localStorage.getItem(`accessToken`), status: value });
            if (response.data.status === 200) {
                const responseIssues = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issues`);
                if (responseIssues.data.status === 200) setData(responseIssues.data.data);
            }
        }
    }

    const handleIssueRemoveSubmit = async (issueId: number): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issue/${issueId}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
        if (response.data.status === 200) {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/issues`);
            if (response.data.status === 200) setData(response.data.data);
        }
    }

    return (
        <RepositoryProvider props={props}>
            {
                ({ repository }: IProps) => {
                    return (
                        <div className="w-full mt-10">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>{repository?.user_name || repository?.user_email}</BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>{repository?.repo_name}</BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem><BreadcrumbPage className="flex items-center"><BugIcon className="mr-2 w-4 h-4" /> 이슈</BreadcrumbPage></BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>

                            <div className="flex items-center py-4 mt-5 justify-between">
                                <Input autoFocus placeholder="이슈 검색..." value={(table.getColumn(`issue_title`)?.getFilterValue() as string) ?? ``} onChange={event => table.getColumn(`issue_title`)?.setFilterValue(event.target.value)} className="max-w-sm" />
                                
                                <div className="flex items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="ml-auto">
                                                행
                                                <ChevronsUpDownIcon className="ml-2 h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                    
                                        <DropdownMenuContent align="end">
                                            {
                                                table.getAllColumns().filter((column) => column.getCanHide()).map((column) => 
                                                    <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={value => column.toggleVisibility(!!value)}>
                                                        {column.id}
                                                    </DropdownMenuCheckboxItem>
                                                )
                                            }
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    {
                                        userData &&
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="ml-3"><PlusIcon className="w-4 h-4 mr-2" />이슈 생성</Button>
                                            </DialogTrigger>

                                            <DialogContent className="w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>이슈 생성</DialogTitle>
                                                    <DialogDescription className="!mt-3">코드의 문제점을 찾고 사람들과 소통하면서 해결해보세요.</DialogDescription>
                                                </DialogHeader>

                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="title" className="text-right">제목</Label>
                                                        <Input ref={title} id="title" className="col-span-3" />
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-4">
                                                        <Label htmlFor="content" className="text-right">설명</Label>
                                                        <Textarea ref={content} id="content" className="col-span-3" />
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button type="submit" onClick={handleIssueSubmit}>생성</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    }
                                </div>
                            </div>
                
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        {
                                            table.getHeaderGroups().map(headerGroup => 
                                                <TableRow key={headerGroup.id}>
                                                    {headerGroup.headers.map(header => 
                                                        <TableHead key={header.id}>
                                                            {
                                                                header.isPlaceholder ?
                                                                null
                                                                :
                                                                flexRender(header.column.columnDef.header, header.getContext())
                                                            }
                                                        </TableHead>
                                                    )}
                                                </TableRow>
                                            )
                                        }
                                    </TableHeader>
                
                                    <TableBody>
                                        {
                                            table.getRowModel().rows?.length ?
                                            table.getRowModel().rows.map(row =>
                                                <TableRow key={row.id} data-state={row.getIsSelected() && `selected`}>
                                                    {
                                                        row.getVisibleCells().map(cell =>
                                                            <TableCell key={cell.id}>
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </TableCell>
                                                        )
                                                    }
                                                </TableRow>
                                            )
                                            :
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                                    해당하는 이슈 없음
                                                </TableCell>
                                            </TableRow>
                                        }
                                    </TableBody>
                                </Table>
                            </div>
                
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <div className="flex-1 text-sm text-muted-foreground">
                                    {table.getFilteredRowModel().rows.length}개의 열중{` `}
                                    {table.getFilteredSelectedRowModel().rows.length}개 선택됨
                                </div>
                
                                <div className="space-x-2">
                                    <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </Button>

                                    <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                        <ChevronRightIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                }
            }
        </RepositoryProvider>
    );
}

export default RepositoryIssues;