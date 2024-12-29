import { Token, TokenType } from '../types/interfaces';

export class Lexer {
    public tokens: Token[];

    private input: string;
    private position: number;
    private line: number;
    private column: number;

    public constructor(input: string) {
        this.tokens = [];
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 0;
    }

    public tokenize(): Token[] {
        while (this.position < this.input.length) {
            const char = this.input[this.position];

            if (char === '\n') {
                this.line++;
                this.column = 0;
                this.position++;
                continue;
            } else {
                this.column++;
            }

            // 공백, 탭 스킵
            if (char === ' ' || char === '\t') {
                this.position++;
                continue;
            }

            // 한 줄 주석 (//)
            if (char === '/' && this.input[this.position + 1] === '/') {
                this.position += 2;
                this.column += 2;
                while (this.position < this.input.length && this.input[this.position] !== '\n') {
                    this.position++;
                    this.column++;
                }
                continue;
            }

            // 여러 줄 주석 (/* ... */)
            if (char === '/' && this.input[this.position + 1] === '*') {
                this.position += 2;
                this.column += 2;
                while (
                    this.position < this.input.length &&
                    !(this.input[this.position] === '*' && this.input[this.position + 1] === '/')
                ) {
                    if (this.input[this.position] === '\n') {
                        this.line++;
                        this.column = 0;
                    } else {
                        this.column++;
                    }
                    this.position++;
                }
                this.position += 2;
                this.column += 2;
                continue;
            }

            // 숫자
            if (this.isDigit(char)) {
                const token = this.tokenizeNumber();
                this.tokens.push(token);
                continue;
            }

            // 식별자 or 키워드
            if (this.isLetter(char)) {
                const token = this.tokenizeIdentifier();
                this.tokens.push(token);
                continue;
            }

            // 문자열
            if (char === '"' || char === '\'') {
                const token = this.tokenizeString();
                this.tokens.push(token);
                continue;
            }

            // =, ==, =>
            if (char === '=') {
                if (this.input[this.position + 1] === '=') {
                    this.tokens.push(this.createToken(TokenType.EQUALITY, '=='));
                    this.position += 2;
                    this.column++;
                } else if (this.input[this.position + 1] === '>') {
                    // =>
                    this.tokens.push(this.createToken(TokenType.ARROW, '=>'));
                    this.position += 2;
                    this.column++;
                } else {
                    this.tokens.push(this.createToken(TokenType.ASSIGN, '='));
                    this.position++;
                }
                continue;
            }

            // !
            if (char === '!') {
                if (this.input[this.position + 1] === '=') {
                    this.tokens.push(this.createToken(TokenType.NOT_EQUAL, '!='));
                    this.position += 2;
                    this.column++;
                } else {
                    throw new Error(`알 수 없는 연산자: ${char} (line: ${this.line}, col: ${this.column})`);
                }
                continue;
            }

            // <, <=, <
            if (char === '<') {
                if (this.input[this.position + 1] === '=') {
                    this.tokens.push(this.createToken(TokenType.LESS_EQUAL, '<='));
                    this.position += 2;
                    this.column++;
                } else {
                    this.tokens.push(this.createToken(TokenType.LESS_THAN, '<'));
                    this.position++;
                }
                continue;
            }

            // >, >=, >
            if (char === '>') {
                if (this.input[this.position + 1] === '=') {
                    this.tokens.push(this.createToken(TokenType.GREATER_EQUAL, '>='));
                    this.position += 2;
                    this.column++;
                } else {
                    this.tokens.push(this.createToken(TokenType.GREATER_THAN, '>'));
                    this.position++;
                }
                continue;
            }

            // + - * /
            if (char === '+') {
                this.tokens.push(this.createToken(TokenType.PLUS, '+'));
                this.position++;
                continue;
            }
            if (char === '-') {
                this.tokens.push(this.createToken(TokenType.MINUS, '-'));
                this.position++;
                continue;
            }
            if (char === '*') {
                this.tokens.push(this.createToken(TokenType.MULTIPLY, '*'));
                this.position++;
                continue;
            }
            if (char === '/') {
                this.tokens.push(this.createToken(TokenType.DIVIDE, '/'));
                this.position++;
                continue;
            }

            // ( ) [ ] { } : ; ,
            if (char === '(') {
                this.tokens.push(this.createToken(TokenType.ROUND_BRACKET_LEFT, '('));
                this.position++;
                continue;
            }
            if (char === ')') {
                this.tokens.push(this.createToken(TokenType.ROUND_BRACKET_RIGHT, ')'));
                this.position++;
                continue;
            }
            if (char === '[') {
                this.tokens.push(this.createToken(TokenType.SQAURE_BRACKET_LEFT, '['));
                this.position++;
                continue;
            }
            if (char === ']') {
                this.tokens.push(this.createToken(TokenType.SQAURE_BRACKET_RIGHT, ']'));
                this.position++;
                continue;
            }
            if (char === '{') {
                this.tokens.push(this.createToken(TokenType.CURLY_BRACKET_LEFT, '{'));
                this.position++;
                continue;
            }
            if (char === '}') {
                this.tokens.push(this.createToken(TokenType.CURLY_BRACKET_RIGHT, '}'));
                this.position++;
                continue;
            }
            if (char === ':') {
                this.tokens.push(this.createToken(TokenType.COLON, ':'));
                this.position++;
                continue;
            }
            if (char === ';') {
                this.tokens.push(this.createToken(TokenType.SEMICOLON, ';'));
                this.position++;
                continue;
            }
            if (char === ',') {
                this.tokens.push(this.createToken(TokenType.COMMA, ','));
                this.position++;
                continue;
            }
            if (char === '.') {
                this.tokens.push(this.createToken(TokenType.DOT, '.'));
                this.position++;
                continue;
            }
            if (char === '#') {
                this.tokens.push(this.createToken(TokenType.HASH_TAG, '#'));
                this.position++;
                continue;
            }
            if (char === '@') {
                this.tokens.push(this.createToken(TokenType.AT, '@'));
                this.position++;
                continue;
            }

            // 알 수 없는 문자
            throw new Error(`알 수 없는 문자: ${char} (line: ${this.line}, col: ${this.column})`);
        }

        return this.tokens;
    }

    private createToken(type: TokenType, value: string): Token {
        return {
            type,
            value,
            line: this.line,
            column: this.column
        };
    }

    private isDigit(char: string) {
        return /[0-9]/.test(char);
    }

    private isLetter(char: string) {
        return /[a-zA-Z_]/.test(char);
    }

    private isIdentifier(char: string) {
        return /[a-zA-Z0-9_]/.test(char);
    }

    private tokenizeNumber(): Token {
        const startLine = this.line;
        const startCol = this.column;

        const start = this.position;
        let hasDot = false;

        while (this.position < this.input.length) {
            const char = this.input[this.position];
            if (char === '\n') {
                this.line++;
                this.column = 0;
            } else {
                this.column++;
            }

            if (this.isDigit(char)) {
                this.position++;
            } else if (char === '.' && !hasDot) {
                hasDot = true;
                this.position++;
            } else {
                break;
            }
        }

        const value = parseFloat(this.input.slice(start, this.position));
        return {
            type: TokenType.NUMBER,
            value,
            line: startLine,
            column: startCol
        };
    }

    private tokenizeString(): Token {
        const quoteChar = this.input[this.position];
        const startLine = this.line;
        const startCol = this.column;

        this.position++; // quote 시작 문자 소비

        let strValue = '';
        while (this.position < this.input.length) {
            const char = this.input[this.position];

            if (char === '\n') {
                this.line++;
                this.column = 0;
            } else {
                this.column++;
            }

            this.position++;

            if (char === quoteChar) {
                // 문자열 종료
                return {
                    type: TokenType.STRING,
                    value: strValue,
                    line: startLine,
                    column: startCol
                };
            }
            strValue += char;
        }

        throw new Error(`문자열이 닫히지 않았습니다. (line: ${this.line}, col: ${this.column})`);
    }

    private tokenizeIdentifier(): Token {
        const startLine = this.line;
        const startCol = this.column;

        const startPos = this.position;
        while (
            this.position < this.input.length &&
            this.isIdentifier(this.input[this.position])
        ) {
            this.column++;
            this.position++;
        }

        const value = this.input.slice(startPos, this.position);

        // 키워드 체크
        if (value === 'var') {
            return { type: TokenType.VARIABLE, value, line: startLine, column: startCol };
        }
        if (value === 'rep') {
            return { type: TokenType.REPLACE, value, line: startLine, column: startCol };
        }
        if (value === 'print') {
            return { type: TokenType.PRINT, value, line: startLine, column: startCol };
        }
        if (value === 'if') {
            return { type: TokenType.IF, value, line: startLine, column: startCol };
        }
        if (value === 'else') {
            return { type: TokenType.ELSE, value, line: startLine, column: startCol };
        }
        if (value === 'function') {
            return { type: TokenType.FUNCTION, value, line: startLine, column: startCol };
        }
        if (value === 'return') {
            return { type: TokenType.RETURN, value, line: startLine, column: startCol };
        }
        if (value === 'class') {
            return { type: TokenType.CLASS, value, line: startLine, column: startCol };
        }
        if (value === 'new') {
            return { type: TokenType.NEW, value, line: startLine, column: startCol };
        }
        if (value === 'lambda') {
            return { type: TokenType.LAMBDA, value, line: startLine, column: startCol };
        }

        // 모듈 관련 키워드
        if (value === 'import') {
            return { type: TokenType.IMPORT, value, line: startLine, column: startCol };
        }
        if (value === 'export') {
            return { type: TokenType.EXPORT, value, line: startLine, column: startCol };
        }
        if (value === 'from') {
            return { type: TokenType.FROM, value, line: startLine, column: startCol };
        }

        if (value === 'for') {
            return { type: TokenType.FOR, value, line: startLine, column: startCol };
        }
        if (value === 'while') {
            return { type: TokenType.WHILE, value, line: startLine, column: startCol };
        }

        // 타입 키워드 (간단 예시)
        if (['Number', 'String', 'Void', 'Unknown', 'Object', 'Array'].includes(value)) {
            return { type: TokenType.TYPE, value, line: startLine, column: startCol };
        }

        // 식별자
        return {
            type: TokenType.IDENTIFIER,
            value,
            line: startLine,
            column: startCol
        };
    }
}
