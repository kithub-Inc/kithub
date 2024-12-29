/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 토큰 타입 정의
 */
export enum TokenType {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    IDENTIFIER = 'IDENTIFIER',
    VARIABLE = 'VARIABLE', // var
    PRINT = 'PRINT',
    IF = 'IF',
    ELSE = 'ELSE',
    FUNCTION = 'FUNCTION',
    RETURN = 'RETURN',
    ASSIGN = 'ASSIGN',
    EQUALITY = 'EQUALITY',
    NOT_EQUAL = 'NOT_EQUAL',
    LESS = 'LESS',
    GREATER = 'GREATER',
    LESS_EQUAL = 'LESS_EQUAL',
    GREATER_EQUAL = 'GREATER_EQUAL',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MULTIPLY = 'MULTIPLY',
    DIVIDE = 'DIVIDE',
    ROUND_BRACKET_LEFT = 'ROUND_BRACKET_LEFT',
    ROUND_BRACKET_RIGHT = 'ROUND_BRACKET_RIGHT',
    SQAURE_BRACKET_LEFT = 'SQAURE_BRACKET_LEFT',
    SQAURE_BRACKET_RIGHT = 'SQAURE_BRACKET_RIGHT',
    CURLY_BRACKET_LEFT = 'CURLY_BRACKET_LEFT',
    CURLY_BRACKET_RIGHT = 'CURLY_BRACKET_RIGHT',
    SEMICOLON = 'SEMICOLON',
    COMMA = 'COMMA',
    DOT = 'DOT',
    COLON = 'COLON',   // ':'
    ARROW = 'ARROW',   // '=>'
    LAMBDA = 'LAMBDA',
    TYPE = 'TYPE',     // 'Number', 'String', 'Void', 'Unknown', 'Object', 'Array'
    LESS_THAN = 'LESS_THAN',       // '<'
    GREATER_THAN = 'GREATER_THAN', // '>'
    FOR = 'FOR',
    WHILE = 'WHILE',
    CLASS = 'CLASS',
    NEW = 'NEW',
    HASH_TAG = 'HASH_TAG',
    REPLACE = 'REPLACE',
    AT = 'AT',

    // 새로 추가한 모듈 시스템 관련 키워드
    IMPORT = 'IMPORT',
    EXPORT = 'EXPORT',
    FROM = 'FROM',
}

/**
 * 토큰 인터페이스
 */
export interface Token {
    type: TokenType;
    value: any;
    line: number;
    column: number;
}

/**
 * AST 노드의 종류
 */
export enum StatementType {
    Program = 'Program',

    // 변수, 함수, 조건문, 출력, 등
    VariableDeclaration = 'VariableDeclaration',
    ReplaceStatement = 'ReplaceStatement',
    FunctionDeclaration = 'FunctionDeclaration',
    IfStatement = 'IfStatement',
    BlockStatement = 'BlockStatement',
    PrintStatement = 'PrintStatement',
    ReturnStatement = 'ReturnStatement',

    // 표현식 관련
    BinaryExpression = 'BinaryExpression',
    CallExpression = 'CallExpression',
    Identifier = 'Identifier',
    Literal = 'Literal',
    ArrayLiteral = 'ArrayLiteral',
    ObjectLiteral = 'ObjectLiteral',
    ReturnValue = 'ReturnValue',
    // ReturnValue는 인터프리터 내부에서만 사용 (제어 흐름 반환)

    // 타입 관련
    // (type alias, interface 등 추가 가능)

    // 모듈 시스템
    ImportDeclaration = 'ImportDeclaration',
    ExportDeclaration = 'ExportDeclaration',

    ClassDeclaration = 'ClassDeclaration',
    MemberExpression = 'MemberExpression',
    PropertyDeclaration = 'PropertyDeclaration',
    NewExpression = 'NewExpression',

    ForStatement = 'ForStatement',
    WhileStatement = 'WhileStatement',

    InfDeclaration = 'InfDeclaration',
    ArrowFunctionStatement = 'ArrowFunctionStatement',

    ApiStatement = 'ApiStatement'
}

/**
 * 단일 AST 노드를 표현하는 타입 (간단히 any 느낌)
 */
export interface Statement {
    type: StatementType;
    [key: string]: any;
}

export interface MemberExpression extends Statement {
    type: StatementType.MemberExpression;
    object: Statement;       // The object expression
    property: Statement;     // The property (could be an identifier or a string literal)
    computed: boolean;       // True if using bracket notation (obj["key"]), false if dot notation (obj.key)
}

export interface ClassDeclaration extends Statement {
    type: StatementType.ClassDeclaration;
    name: string;
    members: Statement[]; // Can include PropertyDeclaration, FunctionDeclaration, etc.
}

export interface PropertyDeclaration extends Statement {
    type: StatementType.PropertyDeclaration;
    key: string;
    propType: TypeNode | null;
}

export interface NewExpression extends Statement {
    type: StatementType.NewExpression;
    className: string;  // or we could store a Statement for more complex cases
    arguments: Statement[];
}

/**
 * 타입 노드 (예시)
 * - Array<T> 형태를 지원하기 위해 elementType 사용
 */
export interface TypeNode {
    kind: 'Number' | 'String' | 'Void' | 'Unknown' | 'Object' | 'Array';
    elementType?: TypeNode; 
}
