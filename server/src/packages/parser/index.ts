import { JWT } from '@/packages/jwt';

export class HeaderParser {
    public static Bearer(token: string) {
        const t = token.replace('Bearer ', '');
        return JWT.verify(t).payload as { user_email: string };
    }
}
