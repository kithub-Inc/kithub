'use client';

import { AntennaIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon, GitPullRequestIcon, PlusIcon } from 'lucide-react';
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

import { IProps, IPullRequest, IRepository } from '@/interfaces/interfaces';

import { useUser } from '@/components/hooks/use-user';

dotenv.config();

const RepositoryPullRequests = (props: any) => {
    const { toast } = useToast();
    const router = useRouter();
    const { data: userData } = useUser();

    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [repository, setRepository] = useState<IRepository>();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [data, setData] = useState<IPullRequest[]>([]);

    const content = useRef<any>(null);
    const title = useRef<any>(null);

    const columns: ColumnDef<IPullRequest>[] = [
        {
            id: `select`,
            header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && `indeterminate`)} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />,
            cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
            enableSorting: false,
            enableHiding: false
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
            accessorKey: `pr_title`,
            header: ({ column }) => 
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === `asc`)}>
                    제목
                    <CaretSortIcon className="ml-2 h-4 w-4" />
                </Button>,
            cell: ({ row }) => <div className="text-right font-medium">{row.getValue(`pr_title`)}</div>
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
                            
                            <DropdownMenuItem onClick={() => router.push(`/repositories/${props.params.node_id}/pullrequests/${origin.node_id}`)}>자세히 보기</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/${origin.user_email}`)}>작성자 보기</DropdownMenuItem>
                            {
                                userData &&
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>신고</DropdownMenuItem>
                                    {
                                        userData?.user_email === origin?.user_email &&
                                        <DropdownMenuItem onClick={() => handlePullRequestRemoveSubmit(origin.node_id)}>삭제</DropdownMenuItem>
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
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequests`);
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

    const handlePullRequestRemoveSubmit = async (pullrequestId: number): Promise<void> => {
        const response = await axios.post(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequest/${pullrequestId}/remove`, { accessToken: localStorage.getItem(`accessToken`) });
        if (response.data.status === 200) {
            const response = await axios.get(`${process.env.BACKEND_URL}/api/repository/${props.params.node_id}/pullrequests`);
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
                                    <BreadcrumbItem><BreadcrumbPage className="flex items-center"><GitPullRequestIcon className="mr-2 w-4 h-4" /> 풀리퀘스트</BreadcrumbPage></BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>

                            <div className="flex items-center py-4 mt-5 justify-between">
                                <Input autoFocus placeholder="리퀘스트 검색..." value={(table.getColumn(`pr_title`)?.getFilterValue() as string) ?? ``} onChange={event => table.getColumn(`pr_title`)?.setFilterValue(event.target.value)} className="max-w-sm" />
                                
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
                                                    해당하는 리퀘스트 없음
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

export default RepositoryPullRequests;