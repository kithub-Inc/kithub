/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-this-alias */

import { Statement, StatementType } from '../types/interfaces';
import { Lexer } from './Lexer';
import { Parser } from './Parser';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 간단한 인터프리터 예시
 */
export class Interpreter {
    public devMode: boolean;
    public logs: string[];

    // 전역 변수 스코프
    public variables: Record<string, any>;

    public nodes: any;

    // 현재 파일에서 export한 항목들
    public currentExports: Record<string, any>;

    // 모듈 캐시: "파일경로" -> "해당 파일의 exports"
    private moduleCache: Record<string, Record<string, any>>;

    constructor() {
        this.devMode = false;
        this.logs = [];
        this.variables = {};
        this.nodes = {};
        this.currentExports = {};
        this.moduleCache = {};
    }

    /**
     * 어떤 AST(파일 단위)를 해석해서 exports를 얻는다.
     */
    public interpret(ast: Statement[], fileName: string, dev: boolean = false): Record<string, any> {
        this.devMode = dev;

        if (this.moduleCache[fileName]) {
            return this.moduleCache[fileName];
        }

        this.currentExports = {};

        for (const stmt of ast) {
            const result = this.evaluate(stmt, fileName);
            if (result && result.type === StatementType.ReturnValue) {
                // 최상위 레벨에서 returnValue는 크게 의미 없으므로 무시
                break;
            }
        }

        this.moduleCache[fileName] = { ...this.currentExports };
        return this.moduleCache[fileName];
    }

    private evaluate(node: Statement, fileName: string): any {
        switch (node.type) {
            case StatementType.BlockStatement:
                return this.evaluateBlockStatement(node, fileName);

            case StatementType.VariableDeclaration:
                return this.evaluateVariableDeclaration(node, fileName);

            case StatementType.ReplaceStatement:
                return this.evaluateReplaceStatement(node, fileName);

            case StatementType.PrintStatement:
                return this.evaluatePrintStatement(node, fileName);

            case StatementType.IfStatement:
                return this.evaluateIfStatement(node, fileName);

            case StatementType.FunctionDeclaration:
                return this.evaluateFunctionDeclaration(node);

            case StatementType.ReturnStatement:
                return {
                    type: StatementType.ReturnValue,
                    value: node.value ? this.evaluate(node.value, fileName) : null
                };

            case StatementType.CallExpression:
                return this.evaluateCallExpression(node, fileName);

            case StatementType.Identifier:
                return this.evaluateIdentifier(node);

            case StatementType.BinaryExpression:
                return this.evaluateBinaryExpression(node, fileName);

            case StatementType.Literal:
                return node.value;

            case StatementType.ArrayLiteral:
                return node.elements.map((elem: Statement) => this.evaluate(elem, fileName));

            case StatementType.ObjectLiteral:
                return this.evaluateObjectLiteral(node, fileName);

            case StatementType.ImportDeclaration:
                return this.evaluateImportDeclaration(node, fileName);

            case StatementType.ExportDeclaration:
                return this.evaluateExportDeclaration(node);

            case StatementType.ForStatement:
                return this.evaluateForStatement(node, fileName);
            
            case StatementType.WhileStatement:
                return this.evaluateWhileStatement(node, fileName);
            
            case StatementType.InfDeclaration:
                return this.evaluateInfDeclaration(node, fileName);
            
            case StatementType.ApiStatement:
                return this.evaluateApiStatement(node, fileName);
            
            case StatementType.ArrowFunctionStatement:
                return this.evaluateArrowFunctionStatement(node, fileName);

            // 클래스 & 객체
            case StatementType.ClassDeclaration:
                return this.evaluateClassDeclaration(node);
            case StatementType.NewExpression:
                return this.evaluateNewExpression(node, fileName);
            case StatementType.MemberExpression:
                return this.evaluateMemberExpression(node, fileName);
            case StatementType.PropertyDeclaration:
                // 실제 실행 시점에서 별도의 동작은 없고, 클래스 선언 내부에서만 사용
                return null;

            default:
                throw new Error(`알 수 없는 노드 타입: ${node.type}`);
        }
    }

    private evaluateApiStatement(node: Statement, fileName: string): any {
        const components = {
            RepositoryEdit: {
                method: 'POST',
                url: 'api/asdf-1'
            },
            CreatePackage: {
                method: 'POST',
                url: 'api/asdf-2'
            }
        };
    
        if (Object.keys(components).includes(node.identifier)) {
            const com = components[node.identifier as keyof typeof components];
            const attrs = node.attributes.map((e: any) => ({ ...e, value: this.evaluate(e.value, fileName) }));

            fetch(`http://localhost:8080/${com.url}`, {
                method: com.method,
                body: attrs
            });

            return null;
        }
    
        // If the identifier is neither a known built-in component nor a user-defined function
        throw new Error(`정의되지 않은 API: ${node.identifier}`);
    }

    private evaluateReplaceStatement(node: Statement, fileName: string): any {
        this.variables[node.identifier] = this.evaluate(node.value, fileName);
        return null;
    }

    private evaluateArrowFunctionStatement(node: Statement, fileName: string): any {
        // Capture the interpreter context and the current variable environment
        const interpreter = this;
        const savedEnv = { ...this.variables };
    
        // Extract parameters and body block from the node
        const { params, block } = node;
    
        // Return a real JS function that, when called, executes the node's block
        const lambdaFunc = function (...args: any[]) {
            // Save the old environment and create a new environment
            const oldVars = interpreter.variables;
            interpreter.variables = { ...savedEnv };
    
            // Assign arguments
            if (params) {
                for (let i = 0; i < params.length; i++) {
                    const paramName = params[i].name;
                    interpreter.variables[paramName] = args[i];
                }
            }
    
            // Run the block
            const result = interpreter.evaluate(block, fileName);
    
            // Restore the old environment
            interpreter.variables = oldVars;
    
            // If the block returned something, yield that value
            if (result && result.type === StatementType.ReturnValue) {
                return result.value;
            }
            return null;
        };
    
        return lambdaFunc;
    }

    private evaluateInfDeclaration(node: Statement, fileName: string): any {
        // Example set of built-in components
        const components = ['Layout', 'Text', 'Button'];
    
        // Decide if the identifier is a recognized component or a user-defined function
        if ([...components, ...Object.keys(this.variables)].includes(node.identifier)) {
            // If the identifier corresponds to a function stored in 'this.variables'
            if (typeof this.variables[node.identifier] === 'function') {
                // Retrieve the parameter names from the function's node definition
                // (this.nodes[node.identifier] should have been set during function declaration)
                const paramNames = this.nodes[node.identifier].params.map((p: any) => p.name);
    
                // Evaluate all attributes and map them to the parameter list
                const args: any[] = [];
                node.attributes.forEach((attr: any, index: number) => {
                    // Evaluate the attribute's value expression
                    const evaluatedValue = this.evaluate(attr.value, fileName);
                    // Match it up with the function’s parameter name by index
                    args[index] = evaluatedValue;
                });
    
                // Call the function with evaluated arguments
                return this.variables[node.identifier](...args);
            }
    
            // If it is a known component type (e.g. 'Text' or 'Button'), build a representation
            return {
                type: node.identifier,
                attributes: node.attributes.map((attr: any) => ({
                    key: attr.key,
                    value: this.evaluate(attr.value, fileName)
                }))
            };
        }
    
        // If the identifier is neither a known built-in component nor a user-defined function
        throw new Error(`정의되지 않은 컴포넌트: ${node.identifier}`);
    }

    private evaluateForStatement(node: Statement, fileName: string): any {
        this.evaluate(node.variable, fileName);
        while (this.evaluate(node.condition, fileName)) {
            const result = this.evaluate(node.block, fileName);
            if (result && result.type === StatementType.ReturnValue) {
                return result;
            }
            this.evaluate(node.repeat, fileName);
        }
        return null;
    }

    private evaluateWhileStatement(node: Statement, fileName: string): any {
        while (this.evaluate(node.condition, fileName)) {
            const result = this.evaluate(node.block, fileName);
            if (result && result.type === StatementType.ReturnValue) {
                return result;
            }
        }
        return null;
    }

    private evaluateBlockStatement(node: Statement, fileName: string): any {
        for (const stmt of node.statements) {
            const result = this.evaluate(stmt, fileName);
            if (result && result.type === StatementType.ReturnValue) {
                return result;
            }
        }
        return null;
    }

    private evaluateVariableDeclaration(node: Statement, fileName: string) {
        const value = this.evaluate(node.value, fileName);
        this.variables[node.identifier] = value;
        return null;
    }

    private evaluatePrintStatement(node: Statement, fileName: string) {
        const val = this.evaluate(node.value, fileName);
        if (!this.devMode) console.log(val);
        else this.logs.push(val);
        return null;
    }

    private evaluateIfStatement(node: Statement, fileName: string) {
        const cond = this.evaluate(node.condition, fileName);
        if (cond) {
            return this.evaluate(node.thenBranch, fileName);
        } else if (node.elseBranch) {
            return this.evaluate(node.elseBranch, fileName);
        }
        return null;
    }

    private evaluateFunctionDeclaration(node: Statement) {
        const funcName = node.identifier;
        this.variables[funcName] = this.createFunction(node, funcName);
        this.nodes = { ...this.nodes, [funcName]: {
            params: node.params
        } };
        return null;
    }

    private evaluateCallExpression(node: Statement, fileName: string) {
        const callee = this.evaluate(node.callee, fileName); 
        const args = node.arguments.map((arg: Statement) => this.evaluate(arg, fileName));
        if (typeof callee !== 'function') {
            throw new Error(`함수가 아닙니다: ${callee}`);
        }
        return callee(...args);
    }

    private evaluateIdentifier(node: Statement) {
        const name = node.name;
        if (!(name in this.variables)) {
            throw new Error(`'${name}' 변수가 선언되지 않았습니다.`);
        }
        return this.variables[name];
    }

    private evaluateBinaryExpression(node: Statement, fileName: string) {
        // 할당(a = b) vs 이항 연산(+, -, ...)
        if (node.operator === '=') {
            return this.evaluateAssignment(node, fileName);
        }

        const left = this.evaluate(node.left, fileName);
        const right = this.evaluate(node.right, fileName);

        switch (node.operator) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left) + String(right);
                }
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            case '==':
                return left == right;
            case '!=':
                return left != right;
            default:
                throw new Error(`알 수 없는 연산자: ${node.operator}`);
        }
    }

    /**
     * a = b 형태에서 a가 MemberExpression인지, Identifier인지 판단.
     */
    private evaluateAssignment(node: Statement, fileName: string) {
        // node.left, node.right
        // left가 Identifier면 스칼라 변수
        // left가 MemberExpression이면 obj.prop
        const rightVal = this.evaluate(node.right, fileName);

        if (node.left.type === StatementType.Identifier) {
            const name = node.left.name;
            this.variables[name] = rightVal;
            return rightVal;
        } 
        else if (node.left.type === StatementType.MemberExpression) {
            const obj = this.evaluate(node.left.object, fileName);
            // computed or not
            let propName: any;
            if (node.left.computed) {
                propName = this.evaluate(node.left.property, fileName);
            } else {
                propName = node.left.property.name;
            }

            // 클래스 인스턴스인지 확인
            if (obj && obj.__className) {
                if (obj.__properties && propName in obj.__properties) {
                    obj.__properties[propName] = rightVal;
                } else {
                    // 동적으로 프로퍼티 추가도 가능하게 할지 결정
                    obj.__properties[propName] = rightVal;
                }
                return rightVal;
            } else {
                // 일반 JS object
                obj[propName] = rightVal;
                return rightVal;
            }
        }
        else {
            throw new Error(`할당할 수 없는 대상입니다.`);
        }
    }

    private evaluateObjectLiteral(node: Statement, fileName: string) {
        const obj: Record<string, any> = {};
        for (const prop of node.properties) {
            obj[prop.key] = this.evaluate(prop.value, fileName);
        }
        return obj;
    }

    // -----------------------------
    // 모듈 시스템
    // -----------------------------
    private evaluateImportDeclaration(node: Statement, fileName: string) {
        const { imports, moduleName } = node;

        const currentDir = path.dirname(fileName);
        const resolvedPath = path.resolve(currentDir, moduleName);

        const otherExports = this.loadModuleAndInterpret(resolvedPath);
        for (const name of imports) {
            if (!(name in otherExports)) {
                throw new Error(`모듈 '${moduleName}'에 '${name}'가 export되지 않았습니다.`);
            }
            this.variables[name] = otherExports[name];
        }
        return null;
    }

    private evaluateExportDeclaration(node: Statement) {
        const { exports } = node;
        for (const name of exports) {
            if (!(name in this.variables)) {
                throw new Error(`'${name}' 변수가 없어서 export할 수 없습니다.`);
            }
            this.currentExports[name] = this.variables[name];
        }
        return null;
    }

    private loadModuleAndInterpret(filePath: string): Record<string, any> {
        if (this.moduleCache[filePath]) {
            return this.moduleCache[filePath];
        }

        const code = fs.readFileSync(filePath, 'utf-8');
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        return this.interpret(ast, filePath);
    }

    // -----------------------------
    // 클래스 & 객체
    // -----------------------------
    private evaluateClassDeclaration(node: Statement) {
        // 클래스 정보를 해석해서 this.variables에 저장
        const className = node.name;

        const properties: { [key: string]: any } = {};
        const methods: { [key: string]: any } = {};

        for (const member of node.members) {
            if (member.type === StatementType.PropertyDeclaration) {
                properties[member.key] = null; 
            } else if (member.type === StatementType.FunctionDeclaration) {
                methods[member.identifier] = this.createMethodFunction(member, className);
            }
        }

        // 클래스 블루프린트
        this.variables[className] = {
            __isClass__: true,
            name: className,
            properties,
            methods
        };
        return null;
    }

    private createMethodFunction(methodNode: Statement, className: string) {
        const interpreter = this;
        return (...args: any[]) => {
            return interpreter.invokeMethod(this, methodNode, args);
        };
    }

    private invokeMethod(thisObj: any, methodNode: Statement, args: any[]) {
        const oldVars = this.variables;
        this.variables = { ...oldVars };

        // this 바인딩
        this.variables['this'] = thisObj;

        // 파라미터 할당
        for (let i = 0; i < methodNode.params.length; i++) {
            const paramName = methodNode.params[i].name;
            this.variables[paramName] = args[i];
        }

        const result = this.evaluate(methodNode.branch, '');
        this.variables = oldVars;

        if (result && result.type === StatementType.ReturnValue) {
            return result.value;
        }
        return null;
    }

    private evaluateNewExpression(node: Statement, fileName: string) {
        const classInfo = this.variables[node.className];
        if (!classInfo || !classInfo.__isClass__) {
            throw new Error(`'${node.className}'는 클래스가 아닙니다.`);
        }

        const instance: any = {
            __className: node.className,
            __properties: { ...classInfo.properties },
            __methods: { ...classInfo.methods }
        };

        // 생성자(__def__)가 있으면 호출
        if (instance.__methods['__def__']) {
            const constructorFn = instance.__methods['__def__'];
            const argVals = node.arguments.map((arg: Statement) => this.evaluate(arg, fileName));
            constructorFn.call(instance, ...argVals);
        }

        return instance;
    }

    private evaluateMemberExpression(node: Statement, fileName: string) {
        const obj = this.evaluate(node.object, fileName);

        // computed vs non-computed
        let propName: any;
        if (node.computed) {
            propName = this.evaluate(node.property, fileName);
        } else {
            propName = node.property.name;
        }

        // 클래스 인스턴스
        if (obj && obj.__className) {
            // 메서드 접근일 수도 있고, 프로퍼티 접근일 수도 있다.
            if (obj.__methods && propName in obj.__methods) {
                // 메서드를 그대로 반환 (JS function)
                return obj.__methods[propName];
            } else if (obj.__properties && propName in obj.__properties) {
                return obj.__properties[propName];
            } else {
                throw new Error(`'${propName}'가 '${obj.__className}' 인스턴스에 존재하지 않습니다.`);
            }
        }

        // 일반 오브젝트라면 직접 접근
        return obj[propName];
    }

    /**
     * 자바스크립트 함수 객체 생성
     */
    private createFunction(funcNode: Statement, functionName: string) {
        const interpreter = this;
        const { params, branch } = funcNode;

        function jsFunc(...args: any[]): any {
            const oldVars = interpreter.variables;
            interpreter.variables = { ...oldVars };

            if (params) {
                for (let i = 0; i < params.length; i++) {
                    const paramName = params[i].name;
                    interpreter.variables[paramName] = args[i];
                }
            }

            const result = interpreter.evaluate(branch, '');
            interpreter.variables = oldVars;

            if (result && result.type === StatementType.ReturnValue) {
                return result.value;
            }
            return null;
        }

        Object.defineProperty(jsFunc, 'name', { value: functionName });
        return jsFunc;
    }
}
