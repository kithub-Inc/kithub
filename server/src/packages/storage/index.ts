import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

export class Storage {
    private S3: S3Client;

    public constructor() {
        const { ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY } = process.env;
        if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) throw new Error('env 파일 세팅이 필요합니다');

        this.S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
        });
    }

    public async get(Key: string) {
        return this.S3.send(new GetObjectCommand({ Bucket: 'inf', Key }));
    }

    public async getPrefix(Prefix: string) {
        return this.S3.send(new ListObjectsCommand({ Bucket: 'inf', Prefix }));
    }

    public async put(Key: string, Body: string | Buffer) {
        return this.S3.send(new PutObjectCommand({ Bucket: 'inf', Key, Body }));
    }

    public async copyFolder(sourcePrefix: string, targetPrefix: string) {
        const listResult = await this.getPrefix(sourcePrefix);
        const contents = listResult.Contents;
        if (!contents) return;

        for (const object of contents) {
            if (!object.Key) continue;

            const sourceKey = object.Key;
            const destinationKey = sourceKey.replace(sourcePrefix, targetPrefix);
            const getObjectResult = await this.get(sourceKey);
            const data = await this.streamToBuffer(getObjectResult.Body as NodeJS.ReadableStream);

            await this.put(destinationKey, data);
        }
    }

    private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        return Buffer.concat(chunks);
    }
}
