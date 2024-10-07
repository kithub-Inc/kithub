/* eslint-disable react-hooks/exhaustive-deps */

import { RefObject, useEffect, useRef, useState } from 'react';

interface IBox {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    hover: boolean;
    target: number[];
    connect: number[];
}

const Canvas = (props: any): JSX.Element => {
    const canvas: RefObject<HTMLCanvasElement> = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

    /* --- */
    const [boxes, setBoxes] = useState<IBox[]>([
        { text: `새로운 레포지토리에 커밋`, x: 300, y: 50, width: 150, height: 50, hover: false, target: [], connect: [1] },
        { text: `cloudtype 자동 배포`, x: 300, y: 100, width: 150, height: 50, hover: false, target: [], connect: [0] },

        { text: `파라미터 검사`, x: 100, y: 200, width: 150, height: 50, hover: false, target: [0, 1, 3, 4], connect: [] },

        { text: `깃허브 연동`, x: 300, y: 200, width: 150, height: 50, hover: false, target: [], connect: [4] },
        { text: `레포지토리 pull`, x: 300, y: 250, width: 150, height: 50, hover: false, target: [], connect: [3] },
    ]);

    let select = -1;
    let move = false;
    let moveStartX = 0;
    let moveStartY = 0;

    const controlPointOffset = 50;

    const drawBox = (box: IBox, ctx: CanvasRenderingContext2D) => {
        /* --- */
        ctx.beginPath();
        ctx.moveTo(box.x, box.y);

        ctx.lineTo(box.x + 20, box.y);
        ctx.lineTo(box.x + 25, box.y - 5);
        ctx.lineTo(box.x + 30, box.y);
        ctx.lineTo(box.x + box.width, box.y);

        ctx.lineTo(box.x + box.width, box.y + box.height);

        ctx.lineTo(box.x + 30, box.y + box.height);
        ctx.lineTo(box.x + 25, box.y + box.height - 5);
        ctx.lineTo(box.x + 20, box.y + box.height);
        ctx.lineTo(box.x, box.y + box.height);

        ctx.lineTo(box.x, box.y);
        ctx.closePath();
        ctx.fillStyle = `#e9e9e9`;
        ctx.fill();
        /* --- */

        /* --- */
        ctx.fillStyle = `#000000`;
        ctx.font = `14px Pretendard`;
        const metrics = ctx.measureText(box.text);
        const width = metrics.width;
        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        box.width = width + 30;
        ctx.fillText(box.text, box.x + 15, box.y + (box.height / 2) + (height / 2));
        /* --- */

        ctx.setLineDash([]);

        /* --- */
        ctx.beginPath();
        ctx.moveTo(box.x + 20, box.y);
        
        ctx.lineTo(box.x + 25, box.y - 5);
        ctx.lineTo(box.x + 30, box.y);
        
        ctx.lineTo(box.x + box.width, box.y);

        ctx.strokeStyle = `#000000`;
        ctx.stroke();
        ctx.closePath();
        /* --- */

        /* --- */
        ctx.beginPath();
        ctx.moveTo(box.x, box.y + box.height);

        ctx.lineTo(box.x + 20, box.y + box.height);
        
        ctx.lineTo(box.x + 25, box.y + box.height - 5);
        ctx.lineTo(box.x + 30, box.y + box.height);

        ctx.strokeStyle = `#000000`;
        ctx.stroke();
        ctx.closePath();
        /* --- */

        if (box.hover) {
            /* --- */
            ctx.beginPath();
            ctx.moveTo(box.x, box.y + 20);

            ctx.lineTo(box.x, box.y + box.height - 20);

            ctx.lineWidth = 2;
            ctx.strokeStyle = `#000000`;
            ctx.stroke();
            ctx.closePath();
            /* --- */

            /* --- */
            ctx.beginPath();
            ctx.moveTo(box.x + box.width, box.y + 20);

            ctx.lineTo(box.x + box.width, box.y + box.height - 20);

            ctx.lineWidth = 2;
            ctx.strokeStyle = `#000000`;
            ctx.stroke();
            ctx.closePath();
            /* --- */
        }

        box.target.forEach(t => {
            if (t !== -1) drawCurve(box, boxes[t], 0, ctx, box.hover || boxes[t].hover);
        });
    }

    const drawCurve = (fromBox: IBox, toBox: IBox, offsetY: number, ctx: CanvasRenderingContext2D, highlight: boolean) => {
        let fromX = fromBox.x;
        let fromY = fromBox.y + fromBox.height / 2 + offsetY;

        let toX = toBox.x + toBox.width;
        let toY = toBox.y + toBox.height / 2;
        
        if (fromBox.x <= toBox.x) {
            fromX = fromBox.x + fromBox.width;
            fromY = fromBox.y + fromBox.height / 2 + offsetY;

            toX = toBox.x;
            toY = toBox.y + toBox.height / 2;
        }

        ctx.strokeStyle = highlight ? `#000000` : `#cacaca`;
        ctx.lineWidth = 2;

        ctx.beginPath();

        if (fromBox.x <= toBox.x) {
            ctx.moveTo(fromX, fromY);
            ctx.bezierCurveTo(fromX + controlPointOffset, fromY, toX - controlPointOffset, toY, toX, toY);

        } else {
            ctx.moveTo(toX, toY);
            ctx.bezierCurveTo(toX + controlPointOffset, toY, fromX - controlPointOffset, fromY, fromX, fromY);
        }

        ctx.setLineDash([5, 5]);
        ctx.stroke();
    }

    useEffect(() => {
        if (canvas.current) setCtx(canvas.current.getContext(`2d`));
    }, [canvas]);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            boxes.forEach((b, idx) => {
                if (
                    e.offsetX >= b.x && e.offsetX <= b.x + b.width &&
                    e.offsetY >= b.y && e.offsetY <= b.y + b.height
                ) {
                    move = true;
                    select = idx;

                    return;
                }
            });
            
            moveStartX = e.offsetX;
            moveStartY = e.offsetY;
        }

        if (canvas.current) {
            canvas.current.addEventListener(`mousedown`, onMouseDown);
            return () => canvas.current?.removeEventListener(`mousedown`, onMouseDown);
        }
    }, [canvas]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (move) {
                const dx = e.offsetX - moveStartX;
                const dy = e.offsetY - moveStartY;

                boxes[select].x += dx;
                boxes[select].y += dy;
                boxes[select].connect.forEach(_ => {
                    const connect = boxes[_];
                    connect.x += dx;
                    connect.y += dy;
                });
                setBoxes(boxes);

                moveStartX = e.offsetX;
                moveStartY = e.offsetY;

            } else {
                boxes.forEach(b => {
                    if (
                        e.offsetX >= b.x && e.offsetX <= b.x + b.width &&
                        e.offsetY >= b.y && e.offsetY <= b.y + b.height
                    ) {
                        b.hover = true;
                        setBoxes(boxes);

                        return ;
                        
                    } else {
                        b.hover = false;
                        setBoxes(boxes);
                    }
                });
            }
        }

        if (canvas.current) {
            canvas.current.addEventListener(`mousemove`, onMouseMove);
            return () => canvas.current?.removeEventListener(`mousemove`, onMouseMove);
        }
    }, [canvas]);

    useEffect(() => {
        const onMouseUp = () => {
            move = false;
            select = -1;
        }

        if (canvas.current) {
            canvas.current.addEventListener(`mouseup`, onMouseUp);
            return () => canvas.current?.removeEventListener(`mouseup`, onMouseUp);
        }
    }, [canvas]);

    setInterval(() => {
        if (ctx) {
            ctx.clearRect(0, 0, props.width, props.height);
            boxes.forEach(e => drawBox(e, ctx));
        }
    }, 1000 / 60);
    /* --- */

    return <canvas ref={canvas} {...props} />
}

export default Canvas;