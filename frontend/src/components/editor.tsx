'use client';

import { ArrowDown01Icon, CodeIcon, Heading1Icon, Heading2Icon, Heading3Icon, Heading4Icon, HeadingIcon, ListIcon } from 'lucide-react';

import { useRouter } from 'next/navigation';
import sanitizeHTML from 'sanitize-html';
import dotenv from 'dotenv';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

dotenv.config();

const Editor = ({ t }: any): JSX.Element => {
    const router = useRouter();

    const handleContentChange = (value: string) => {
        // router.(`?t=${value}`);
    }

    const formatText = (command: string) => {
        document.execCommand(command, false, ``);
    }

    const insertCodeBlock = () => {
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const codeBlock = document.createElement(`pre`);

            codeBlock.innerHTML = `<code class="code2 my-1 bg-slate-100 rounded-md flex items-center">코드는 여기에</code>`;
            
            range.deleteContents();
            range.insertNode(codeBlock);
            range.setStart(codeBlock, 0);
            range.setEnd(codeBlock, 0);
        }
    }

    const formatHeading = (level: number) => {
        document.execCommand('formatBlock', false, `h${level}`);
    }

    return (
            <>
            <div className="flex gap-2 mt-5">
                <Button onClick={() => formatText(`bold`)} variant="outline" size="icon"><b>B</b></Button>
                <Button onClick={() => formatText(`italic`)} variant="outline" size="icon"><i>I</i></Button>
                <Button onClick={() => formatText(`underline`)} variant="outline" size="icon"><u>U</u></Button>
                <Button onClick={() => formatText(`insertUnorderedList`)} variant="outline" size="icon"><ListIcon className="w-4 h-4" /></Button>
                <Button onClick={() => formatText(`insertOrderedList`)} variant="outline" size="icon"><ArrowDown01Icon className="w-4 h-4" /></Button>
                <Button onClick={insertCodeBlock} variant="outline" size="icon"><CodeIcon className="w-4 h-4" /></Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon"><HeadingIcon className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => formatHeading(1)}><Heading1Icon className="w-4 h-4" /></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => formatHeading(2)}><Heading2Icon className="w-4 h-4" /></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => formatHeading(3)}><Heading3Icon className="w-4 h-4" /></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => formatHeading(4)}><Heading4Icon className="w-4 h-4" /></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="outline-none border rounded-md p-4 markdown" contentEditable onInput={e => handleContentChange(e.currentTarget.innerHTML)} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: sanitizeHTML(t, { allowedTags: [`b`, `i`, `u`, `h1`, `h2`, `h3`, `h4`, `img`, `ul`, `ol`, `li`, `pre`, `code`, `div`, `br`] }) }} />
        </>
    );
}

export default Editor;