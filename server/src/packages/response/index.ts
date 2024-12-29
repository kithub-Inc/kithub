/* eslint-disable @typescript-eslint/no-explicit-any */

export class Response {
    public status: number = 404;
    public message: string = '';
    public data: any = null;

    public json() {
        const { status, message, data } = this;
        return JSON.stringify({ status, message, data }, null, 4);
    }
}
