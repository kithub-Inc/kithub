/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Token,
    TokenType,
    Statement,
    StatementType,
    TypeNode
} from '../types/interfaces';

export class Parser {
    public tokens: Token[];
    private position: number;

    public constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.position = 0;
    }

    public parse(): Statement[] {
        const statements: Statement[] = [];
        while (this.position < this.tokens.length) {
            statements.push(this.parseStatement());
        }
        return statements;
    }

    private currentToken(): Token {
        return this.tokens[this.position];
    }

    private peek(type: TokenType): boolean {
        const token = this.currentToken();
        return token && token.type === type;
    }

    private expect(type: TokenType): Token {
        const token = this.currentToken();
        if (!token) {
            throw new Error(`토큰이 더 이상 없습니다. '${type}'가 필요합니다.`);
        }
        if (token.type !== type) {
            throw new Error(
                `예상: '${type}' 이지만 실제: '${token.type}' (value: ${token.value}, line: ${token.line}, col: ${token.column})`
            );
        }
        this.position++;
        return token;
    }

    /**
     * Statement 파싱
     */
    private parseStatement(): Statement {
        const token = this.currentToken();
        if (!token) {
            throw new Error(`더 이상 파싱할 토큰이 없습니다.`);
        }

        switch (token.type) {
            case TokenType.VARIABLE:
                return this.parseVariableDeclaration();
            case TokenType.PRINT:
                return this.parsePrintStatement();
            case TokenType.IF:
                return this.parseIfStatement();
            case TokenType.FUNCTION:
                return this.parseFunctionDeclaration();
            case TokenType.RETURN:
                return this.parseReturnStatement();
            case TokenType.IMPORT:
                return this.parseImportDeclaration();
            case TokenType.EXPORT:
                return this.parseExportDeclaration();
            case TokenType.FOR:
                return this.parseForStatement();
            case TokenType.WHILE:
                return this.parseWhileStatement();
            case TokenType.CLASS:
                return this.parseClassDeclaration();
            default:
                // 표현식 문
                return this.parseExpressionStatement();
        }
    }

    private parseInfDeclaration(): Statement {
        this.expect(TokenType.HASH_TAG);
        const identifier = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.ARROW);
        this.expect(TokenType.ROUND_BRACKET_LEFT);
        const attributes: { key: string; value: any }[] = [];
        while (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
            const key = this.expect(TokenType.IDENTIFIER).value;
            this.expect(TokenType.COLON);
            const value = this.parseExpression();
            attributes.push({ key, value });

            if (this.peek(TokenType.COMMA)) {
                this.position++; // 콤마 소비
            } else {
                break;
            }
        }
        this.expect(TokenType.ROUND_BRACKET_RIGHT);

        return {
            type: StatementType.InfDeclaration,
            identifier, attributes
        }
    }

    private parseNewStatement(): Statement {
        const token = this.currentToken();
        this.expect(TokenType.NEW);
        const classToken = this.expect(TokenType.IDENTIFIER); // 클래스 이름
        this.expect(TokenType.ROUND_BRACKET_LEFT);

        const args: Statement[] = [];
        if (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
            while (true) {
                args.push(this.parseExpression());
                if (this.peek(TokenType.COMMA)) {
                    this.position++;
                    continue;
                }
                break;
            }
        }
        this.expect(TokenType.ROUND_BRACKET_RIGHT);

        const newExpr: Statement = {
            type: StatementType.NewExpression,
            className: classToken.value,
            arguments: args,
            line: token.line,
            column: token.column
        };

        // 멤버 액세스를 chaining 할 수도 있음 (new Person(...).someMethod())
        // parsePostFix() 로 넘겨서 . or () etc 처리
        return this.parsePostFix(newExpr);
    }

    // -----------------------------
    // 클래스 관련
    // -----------------------------
    private parseClassDeclaration(): Statement {
        const classToken = this.expect(TokenType.CLASS); // 'class'
        const identifier = this.expect(TokenType.IDENTIFIER); // 클래스 이름
        this.expect(TokenType.CURLY_BRACKET_LEFT);            // '{'

        const members: Statement[] = [];
        while (!this.peek(TokenType.CURLY_BRACKET_RIGHT)) {
            members.push(this.parseClassMember());
        }

        this.expect(TokenType.CURLY_BRACKET_RIGHT);           // '}'

        return {
            type: StatementType.ClassDeclaration,
            name: identifier.value,
            members,
            line: classToken.line,
            column: classToken.column
        };
    }

    private parseClassMember(): Statement {
        // 예: "name: String;" => PropertyDeclaration
        //     "__def__(name: String): Void { ... }" => FunctionDeclaration
        //     "say(): Void { ... }" => FunctionDeclaration
        const token = this.currentToken();
        if (token.type !== TokenType.IDENTIFIER) {
            throw new Error(`클래스 멤버 구문이 잘못되었습니다. (line: ${token.line}, col: ${token.column})`);
        }

        // lookahead: next token
        const next = this.tokens[this.position + 1];
        // property: identifier : Type
        if (next && next.type === TokenType.COLON) {
            return this.parsePropertyDeclaration();
        } 
        // method: identifier(...)
        if (next && next.type === TokenType.ROUND_BRACKET_LEFT) {
            return this.parseMethodDeclaration();
        }

        throw new Error(`클래스 멤버를 파싱할 수 없습니다. 토큰: '${token.value}'`);
    }

    private parsePropertyDeclaration(): Statement {
        // 예: "name: String;"
        const keyToken = this.expect(TokenType.IDENTIFIER);
        this.expect(TokenType.COLON);
        const propType = this.parseType();
        this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.PropertyDeclaration,
            key: keyToken.value,
            propType,
            line: keyToken.line,
            column: keyToken.column
        };
    }

    private parseMethodDeclaration(): Statement {
        // 예: "say(): Void { ... }" 
        //     "__def__(name: String): Void { ... }"
        const funcId = this.expect(TokenType.IDENTIFIER); // 메서드 이름
        this.expect(TokenType.ROUND_BRACKET_LEFT);

        const params: { name: string; paramType: TypeNode | null }[] = [];
        if (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
            while (true) {
                const paramId = this.expect(TokenType.IDENTIFIER);

                let paramType: TypeNode | null = null;
                if (this.peek(TokenType.COLON)) {
                    this.position++; // ':'
                    paramType = this.parseType();
                }

                params.push({ name: paramId.value, paramType });

                if (this.peek(TokenType.COMMA)) {
                    this.position++;
                    continue;
                }
                break;
            }
        }

        this.expect(TokenType.ROUND_BRACKET_RIGHT);

        let returnType: TypeNode | null = null;
        if (this.peek(TokenType.COLON)) {
            // 예: "say(name: String): Void { ... }" 
            // 가령 ': Void' 로 표현하는 형태라면
            this.position++; 
            returnType = this.parseType();
        }

        if (this.peek(TokenType.ARROW)) {
            // "=>" 처리
            this.position++;
            returnType = this.parseType();
        }

        // 함수 블록
        const body = this.parseBlock();

        return {
            type: StatementType.FunctionDeclaration,
            identifier: funcId.value,
            params,
            returnType,
            branch: body,
            line: funcId.line,
            column: funcId.column,
            isMethod: true
        };
    }

    // -----------------------------
    // 반복문
    // -----------------------------
    private parseForStatement(): Statement {
        this.expect(TokenType.FOR);
        this.expect(TokenType.ROUND_BRACKET_LEFT);
        const variable = this.parseVariableDeclaration();
        const condition = this.parseExpression();
        this.expect(TokenType.SEMICOLON);
        const repeat = this.parseVariableDeclaration();
        this.expect(TokenType.ROUND_BRACKET_RIGHT);
        const block = this.parseBlock();

        return {
            type: StatementType.ForStatement,
            variable, condition, repeat, block
        };
    }
    
    private parseWhileStatement(): Statement {
        this.expect(TokenType.WHILE);
        this.expect(TokenType.ROUND_BRACKET_LEFT);
        const condition = this.parseExpression();
        this.expect(TokenType.ROUND_BRACKET_RIGHT);
        const block = this.parseBlock();

        return {
            type: StatementType.WhileStatement,
            condition, block
        };
    }

    // -----------------------------
    // 모듈 시스템
    // -----------------------------
    private parseImportDeclaration(): Statement {
        const importToken = this.expect(TokenType.IMPORT);

        this.expect(TokenType.CURLY_BRACKET_LEFT);
        const imports: string[] = [];
        while (!this.peek(TokenType.CURLY_BRACKET_RIGHT)) {
            const id = this.expect(TokenType.IDENTIFIER);
            imports.push(id.value);

            if (this.peek(TokenType.COMMA)) {
                this.position++; // 콤마 소비
            } else {
                break;
            }
        }
        this.expect(TokenType.CURLY_BRACKET_RIGHT);

        this.expect(TokenType.FROM);
        const moduleNameToken = this.expect(TokenType.STRING);
        const semi = this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.ImportDeclaration,
            imports,
            moduleName: moduleNameToken.value,
            line: importToken.line,
            column: importToken.column,
            endLine: semi.line,
            endColumn: semi.column
        };
    }

    private parseExportDeclaration(): Statement {
        const exportToken = this.expect(TokenType.EXPORT);

        this.expect(TokenType.CURLY_BRACKET_LEFT);
        const exports: string[] = [];
        while (!this.peek(TokenType.CURLY_BRACKET_RIGHT)) {
            const id = this.expect(TokenType.IDENTIFIER);
            exports.push(id.value);

            if (this.peek(TokenType.COMMA)) {
                this.position++;
            } else {
                break;
            }
        }
        this.expect(TokenType.CURLY_BRACKET_RIGHT);

        const semi = this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.ExportDeclaration,
            exports,
            line: exportToken.line,
            column: exportToken.column,
            endLine: semi.line,
            endColumn: semi.column
        };
    }

    private parseParamsLiteral() {
        this.expect(TokenType.ROUND_BRACKET_LEFT);
        const params: { name: string; paramType: TypeNode | null }[] = [];
        if (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
            while (true) {
                const paramId = this.expect(TokenType.IDENTIFIER);

                let paramType: TypeNode | null = null;
                if (this.peek(TokenType.COLON)) {
                    this.position++;
                    paramType = this.parseType();
                }

                params.push({ name: paramId.value, paramType });

                if (this.peek(TokenType.COMMA)) {
                    this.position++;
                    continue;
                }
                break;
            }
        }

        this.expect(TokenType.ROUND_BRACKET_RIGHT);
        return params;
    }

    // -----------------------------
    // 함수, 변수
    // -----------------------------
    private parseFunctionDeclaration(): Statement {
        const funcToken = this.expect(TokenType.FUNCTION);
        const identifier = this.expect(TokenType.IDENTIFIER);
        const params = this.parseParamsLiteral();

        let returnType: TypeNode | null = null;
        if (this.peek(TokenType.ARROW)) {
            this.position++;
            returnType = this.parseType();
        }

        const branch = this.parseBlock();
        return {
            type: StatementType.FunctionDeclaration,
            identifier: identifier.value,
            params,
            returnType,
            branch,
            line: funcToken.line,
            column: funcToken.column
        };
    }

    private parseReturnStatement(): Statement {
        const returnToken = this.expect(TokenType.RETURN);
        let value: Statement | null = null;
        if (!this.peek(TokenType.SEMICOLON)) {
            value = this.parseExpression();
        }
        this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.ReturnStatement,
            value
        };
    }

    private parseVariableDeclaration(): Statement {
        const varToken = this.expect(TokenType.VARIABLE);
        const identifier = this.expect(TokenType.IDENTIFIER);

        let varType: TypeNode | null = null;
        if (this.peek(TokenType.COLON)) {
            this.position++;
            varType = this.parseType();
        }

        this.expect(TokenType.ASSIGN);
        const value = this.parseExpression();

        const semi = this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.VariableDeclaration,
            identifier: identifier.value,
            varType,
            value,
            line: varToken.line,
            column: varToken.column,
            endLine: semi.line,
            endColumn: semi.column
        };
    }

    private parseIfStatement(): Statement {
        const ifToken = this.expect(TokenType.IF);
        this.expect(TokenType.ROUND_BRACKET_LEFT);

        const condition = this.parseExpression();
        this.expect(TokenType.ROUND_BRACKET_RIGHT);

        const thenBranch = this.parseBlock();

        let elseBranch: Statement | undefined;
        const nextToken = this.currentToken();
        if (nextToken && nextToken.type === TokenType.ELSE) {
            this.position++;
            elseBranch = this.parseBlock();
        }

        return {
            type: StatementType.IfStatement,
            condition,
            thenBranch,
            elseBranch,
            line: ifToken.line,
            column: ifToken.column
        };
    }

    private parsePrintStatement(): Statement {
        const printToken = this.expect(TokenType.PRINT);
        const value = this.parseExpression();
        const semi = this.expect(TokenType.SEMICOLON);

        return {
            type: StatementType.PrintStatement,
            value,
            line: printToken.line,
            column: printToken.column,
            endLine: semi.line,
            endColumn: semi.column
        };
    }

    private parseBlock(): Statement {
        const token = this.currentToken();
        if (token.type === TokenType.CURLY_BRACKET_LEFT) {
            const leftBrace = this.expect(TokenType.CURLY_BRACKET_LEFT);
            const statements: Statement[] = [];

            while (this.currentToken() && this.currentToken().type !== TokenType.CURLY_BRACKET_RIGHT) {
                statements.push(this.parseStatement());
            }
            const rightBrace = this.expect(TokenType.CURLY_BRACKET_RIGHT);

            return {
                type: StatementType.BlockStatement,
                statements,
                line: leftBrace.line,
                column: leftBrace.column,
                endLine: rightBrace.line,
                endColumn: rightBrace.column
            };
        } else {
            // 중괄호 없는 단일 문
            const single = this.parseStatement();
            return {
                type: StatementType.BlockStatement,
                statements: [single],
                line: single.line,
                column: single.column
            };
        }
    }

    private parseExpressionStatement(): Statement {
        const expr = this.parseExpression();
        const semi = this.expect(TokenType.SEMICOLON);
        return {
            type: StatementType.BlockStatement,
            statements: [expr],
            line: expr.line,
            column: expr.column,
            endLine: semi.line,
            endColumn: semi.column
        };
    }

    // ------------------------
    // 표현식 파싱
    // ------------------------

    private parseExpression(): Statement {
        // 여기서 간단히 이항식을 처리
        return this.parseAssignmentExpression();
    }

    /**
     * 예: a = b, a.b = c
     * 단순 할당식도 처리
     */
    private parseAssignmentExpression(): Statement {
        const left = this.parseBinaryExpression();
        // 할당 구문인지 확인
        if (this.currentToken() && this.currentToken().type === TokenType.ASSIGN) {
            const assignToken = this.expect(TokenType.ASSIGN);
            const right = this.parseAssignmentExpression();
            return {
                type: StatementType.BinaryExpression,
                operator: '=',
                left,
                right,
                line: assignToken.line,
                column: assignToken.column
            };
        }
        return left;
    }

    private parseBinaryExpression(): Statement {
        let left = this.parseTerm();

        while (
            this.currentToken() &&
            [TokenType.PLUS, TokenType.MINUS].includes(this.currentToken().type)
        ) {
            const opToken = this.currentToken();
            this.position++;

            const right = this.parseTerm();
            left = {
                type: StatementType.BinaryExpression,
                operator: opToken.value,
                left,
                right,
                line: opToken.line,
                column: opToken.column
            };
        }

        return left;
    }

    private parseTerm(): Statement {
        let left = this.parseRelational();

        while (
            this.currentToken() &&
            [TokenType.MULTIPLY, TokenType.DIVIDE].includes(this.currentToken().type)
        ) {
            const opToken = this.currentToken();
            this.position++;

            const right = this.parseRelational();
            left = {
                type: StatementType.BinaryExpression,
                operator: opToken.value,
                left,
                right,
                line: opToken.line,
                column: opToken.column
            };
        }

        return left;
    }

    private parseRelational(): Statement {
        const relationalOps = [
            TokenType.LESS_THAN,
            TokenType.GREATER_THAN,
            TokenType.LESS_EQUAL,
            TokenType.GREATER_EQUAL,
            TokenType.EQUALITY,
            TokenType.NOT_EQUAL
        ];
        let left = this.parseFactor();

        while (
            this.currentToken() &&
            relationalOps.includes(this.currentToken().type)
        ) {
            const opToken = this.currentToken();
            this.position++;

            const right = this.parseFactor();
            left = {
                type: StatementType.BinaryExpression,
                operator: opToken.value,
                left,
                right,
                line: opToken.line,
                column: opToken.column
            };
        }

        return left;
    }

    private parseFactor(): Statement {
        const expr = this.parsePrimary();
        return expr;
    }

    private parseArrowFunctionStatement(): Statement {
        this.expect(TokenType.LAMBDA);
        const params = this.parseParamsLiteral();
        this.expect(TokenType.ARROW);
        const block = this.parseBlock();

        return {
            type: StatementType.ArrowFunctionStatement,
            params, block
        }
    }

    private parsePrimary(): Statement {
        const token = this.currentToken();
        if (!token) {
            throw new Error('표현식을 찾을 수 없습니다.');
        }

        // 배열 리터럴 [ ... ]
        if (token.type === TokenType.SQAURE_BRACKET_LEFT) {
            return this.parseArrayLiteral();
        }
        // 오브젝트 리터럴 { ... }
        if (token.type === TokenType.CURLY_BRACKET_LEFT) {
            return this.parseObjectLiteral();
        }

        if (token.type === TokenType.NUMBER || token.type === TokenType.STRING) {
            this.position++;
            return {
                type: StatementType.Literal,
                value: token.value,
                line: token.line,
                column: token.column
            };
        }

        if (token.type === TokenType.IDENTIFIER) {
            // 식별자
            this.position++;
            // 이후 .()[] 등 후처리
            const idExpr: Statement = {
                type: StatementType.Identifier,
                name: token.value,
                line: token.line,
                column: token.column
            };
            return this.parsePostFix(idExpr);
        }

        if (token.type === TokenType.LAMBDA) {
            return this.parseArrowFunctionStatement();
        }

        if (token.type === TokenType.ROUND_BRACKET_LEFT) {
            // ( expr )
            this.position++;
            const expr = this.parseExpression();
            this.expect(TokenType.ROUND_BRACKET_RIGHT);
            return this.parsePostFix(expr);
        }

        if (token.type === TokenType.HASH_TAG) {
            return this.parseInfDeclaration();
        }

        if (token.type === TokenType.NEW) {
            return this.parseNewStatement();
        }

        if (token.type === TokenType.REPLACE) {
            return this.parseReplaceStatement();
        }

        if (token.type === TokenType.AT) {
            return this.parseApiStatement();
        }

        throw new Error(`예기치 않은 토큰: '${token.value}' (line: ${token.line}, col: ${token.column})`);
    }

    private parseApiStatement(): Statement {
        this.expect(TokenType.AT);
        const identifier = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.ARROW);
        this.expect(TokenType.ROUND_BRACKET_LEFT);
        const attributes: { key: string; value: any }[] = [];
        while (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
            const key = this.expect(TokenType.IDENTIFIER).value;
            this.expect(TokenType.COLON);
            const value = this.parseExpression();
            attributes.push({ key, value });

            if (this.peek(TokenType.COMMA)) {
                this.position++; // 콤마 소비
            } else {
                break;
            }
        }
        this.expect(TokenType.ROUND_BRACKET_RIGHT);

        return {
            type: StatementType.ApiStatement,
            identifier, attributes
        }
    }

    private parseReplaceStatement(): Statement {
        this.expect(TokenType.REPLACE);
        const identifier = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.ASSIGN);
        const value = this.parseExpression();

        return {
            type: StatementType.ReplaceStatement,
            identifier, value
        }
    }

    private parsePostFix(expr: Statement): Statement {
        // 멤버 접근, 함수 호출 등
        while (true) {
            const token = this.currentToken();
            if (!token) break;

            if (this.peek(TokenType.DOT)) {
                // obj.prop
                this.position++; // consume '.'
                const propToken = this.expect(TokenType.IDENTIFIER);
                const memberExpr: Statement = {
                    type: StatementType.MemberExpression,
                    object: expr,
                    property: {
                        type: StatementType.Identifier,
                        name: propToken.value,
                        line: propToken.line,
                        column: propToken.column
                    },
                    computed: false,
                    line: propToken.line,
                    column: propToken.column
                };
                expr = memberExpr;
            }
            else if (this.peek(TokenType.SQAURE_BRACKET_LEFT)) {
                // obj["prop"]
                this.position++;
                const propExpr = this.parseExpression();
                this.expect(TokenType.SQAURE_BRACKET_RIGHT);
                const memberExpr: Statement = {
                    type: StatementType.MemberExpression,
                    object: expr,
                    property: propExpr,
                    computed: true,
                    line: propExpr.line,
                    column: propExpr.column
                };
                expr = memberExpr;
            }
            else if (this.peek(TokenType.ROUND_BRACKET_LEFT)) {
                // 함수 호출
                this.position++; // '('
                const args: Statement[] = [];
                if (!this.peek(TokenType.ROUND_BRACKET_RIGHT)) {
                    while (true) {
                        args.push(this.parseExpression());
                        if (this.peek(TokenType.COMMA)) {
                            this.position++;
                            continue;
                        }
                        break;
                    }
                }
                const rparen = this.expect(TokenType.ROUND_BRACKET_RIGHT);

                // CallExpression
                const callExpr: Statement = {
                    type: StatementType.CallExpression,
                    callee: expr,
                    arguments: args,
                    line: expr.line,
                    column: expr.column,
                    endLine: rparen.line,
                    endColumn: rparen.column
                };
                expr = callExpr;
            }
            else {
                break;
            }
        }

        return expr;
    }

    private parseArrayLiteral(): Statement {
        const leftBracket = this.expect(TokenType.SQAURE_BRACKET_LEFT);

        const elements: Statement[] = [];
        while (!this.peek(TokenType.SQAURE_BRACKET_RIGHT)) {
            elements.push(this.parseExpression());
            if (this.peek(TokenType.COMMA)) {
                this.position++;
            } else {
                break;
            }
        }

        const rightBracket = this.expect(TokenType.SQAURE_BRACKET_RIGHT);

        return {
            type: StatementType.ArrayLiteral,
            elements,
            line: leftBracket.line,
            column: leftBracket.column,
            endLine: rightBracket.line,
            endColumn: rightBracket.column
        };
    }

    private parseObjectLiteral(): Statement {
        const leftBrace = this.expect(TokenType.CURLY_BRACKET_LEFT);

        const properties: { key: string; value: Statement }[] = [];
        while (!this.peek(TokenType.CURLY_BRACKET_RIGHT)) {
            const keyToken = this.currentToken();
            if (keyToken.type !== TokenType.IDENTIFIER && keyToken.type !== TokenType.STRING) {
                throw new Error(
                    `오브젝트 키는 식별자 혹은 문자열이어야 합니다. (line: ${keyToken.line}, col: ${keyToken.column})`
                );
            }
            this.position++;

            this.expect(TokenType.COLON);

            const valueExpr = this.parseExpression();
            properties.push({ key: keyToken.value, value: valueExpr });

            if (this.peek(TokenType.COMMA)) {
                this.position++;
            } else {
                break;
            }
        }

        const rightBrace = this.expect(TokenType.CURLY_BRACKET_RIGHT);

        return {
            type: StatementType.ObjectLiteral,
            properties,
            line: leftBrace.line,
            column: leftBrace.column,
            endLine: rightBrace.line,
            endColumn: rightBrace.column
        };
    }

    /**
     * 타입 파싱 (예: Number, String, Array<Number>)
     */
    private parseType(): TypeNode {
        const token = this.currentToken();
        if (!token) {
            throw new Error(`타입 토큰이 필요합니다.`);
        }

        if (token.type === TokenType.TYPE) {
            const base = token.value; 
            this.position++;
            if (base !== 'Array') {
                return { kind: base };
            }
            // Array<T>
            let elementType: TypeNode = { kind: 'Unknown' };
            if (this.peek(TokenType.LESS_THAN)) {
                this.position++; // '<'
                elementType = this.parseType();
                const gtToken = this.currentToken();
                if (!gtToken || gtToken.type !== TokenType.GREATER_THAN) {
                    throw new Error(`'>'가 필요합니다. (line: ${gtToken?.line}, col: ${gtToken?.column})`);
                }
                this.position++; // '>'
            }
            return { kind: 'Array', elementType };
        }

        throw new Error(`타입 파싱 중 알 수 없는 토큰: ${token.value}`);
    }
}
