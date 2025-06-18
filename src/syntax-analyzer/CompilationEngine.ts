import {getKind, Kind, SymbolTable} from "../compiler/SymbolTable";
import {VMWriter} from "../compiler/VMWriter";
import {TokenTypeMapping} from "./constants";
import {ExpectedIdentifierError, ExpectedOperatorError, InvalidTokenError, InvalidTypeError} from "./Errors";
import {JackTokenizer} from "./JackTokenizer";

export class CompilationEngine {
    private output: string[] = []
    private className: string

    private opTable = {
        '+': 'ADD',
        '-': 'SUB',
        '&': 'AND',
        '|': 'OR',
        '<': 'LT',
        '>': 'GT',
        '=': 'EQ'
    }

    constructor(
        private tokenizer: JackTokenizer,
        private symTable: SymbolTable,
        private writer: VMWriter
    ) {
    }

    public run() {
        this.tokenizer.advance()
        this.compileClass()
        this.writer.close()
    }

    private convertKind(kind: Kind) {
        return {
            'ARG': 'ARGUMENT',
            'STATIC': 'STATIC',
            'VAR': 'LOCAL',
            'FIELD': 'THIS'
        }[kind]
    }


    static Types = ['int', 'char', 'boolean']
    static Operators = ['+', '-', '*', '/', '&', '|', '<', '>', '=']
    static UnaryOps = ['-', '~']
    static Void = 'void'
    static KeywordConstants = ['true', 'false', 'null', 'this']

    public getTree() {
        return this.output
    }

    public getSym() {
        return this.symTable
    }

    private currentToken() {
        return this.tokenizer.getCurrentToken()
    }

    private nextToken() {
        return this.tokenizer.getNextToken()
    }


    private eat(expect?: string) {
        const token = this.currentToken()

        if (expect && (expect !== token.value)) {
            throw new InvalidTokenError(token.value)
        }

        const representation = TokenTypeMapping[token.type]

        this.tag(representation, token.value)
        this.tokenizer.advance()
        return token.value
    }

    private eatIdentifier() {
        const token = this.currentToken()
        if (token.type !== 'IDENTIFIER') {
            throw new ExpectedIdentifierError(token.type)
        }
        this.eat()
        return token.value
    }

    private eatType(expansionList?: string[]) {
        const token = this.currentToken()

        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            const typesToCheck = CompilationEngine.Types.concat(expansionList)

            if (typesToCheck.includes(token.value) || token.type === 'IDENTIFIER') {
                this.tag(TokenTypeMapping[token.type], token.value)
                this.tokenizer.advance()
                return token.value
            } else {
                throw new InvalidTypeError(token.value)
            }
        } else {
            throw new InvalidTokenError(token.value)
        }

    }

    private eatOperator() {
        if (!CompilationEngine.Operators.includes(this.currentToken().value))
            throw new ExpectedOperatorError(this.currentToken().type)
        return this.eat(this.currentToken().value) // op
    }

    private eatUnaryOp() {
        if (!CompilationEngine.UnaryOps.includes(this.currentToken().value))
            throw new ExpectedOperatorError(this.currentToken().type)

        return this.eat(this.currentToken().value)
    }


    private match(expect: string) {
        return this.currentToken().value === expect
    }

    private matchNext(expect: string) {
        return this.nextToken().value === expect
    }

    private startTag(tag: string) {
        this.write(`<${tag}>`)
    }

    private tag(tag: string, value: string) {

        const v = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "&": "&amp;",
        }[value] || value

        this.write(`<${tag}> ${v} </${tag}>`)
    }

    private endTag(tag: string) {
        this.write(`</${tag}>`)
    }

    private write(line: string) {
        this.output.push(line)
    }

    compileClass() {
        this.startTag('class')

        this.eat('class')
        const className = this.eatIdentifier() // className
        this.className = className
        this.eat('{')

        this.compileClassVarDec() // zero or one
        this.compileSubroutine() // zero or one

        this.eat('}')
        this.endTag('class')


    }

    compileClassVarDec() {
        const currentToken = this.currentToken()


        if (!(['static', 'field'].includes(currentToken.value))) {
            return
        }

        this.startTag('classVarDec')

        const kind = this.eat() // static | field
        const type = this.eatType() // int | boolean | ...
        const varName = this.eat() // varName

        this.symTable.define(varName, type, getKind(kind))

        while (this.currentToken().value === ',') {
            this.eat(',')
            const name = this.eatIdentifier()
            this.symTable.define(name, type, getKind(kind))
        }
        this.eat(';')
        this.endTag('classVarDec')

        this.compileClassVarDec()
    }

    compileSubroutine() {
        if (!(['constructor', 'function', 'method'].includes(this.currentToken().value))) return
        this.startTag('subroutineDec')

        this.symTable.reset() // clear the subroutine table

        const fnType = this.eat() // keyword - method type
        if (fnType === 'method') {
            this.symTable.define('this', this.className, "ARG")
        }
        // eat common types + void
        this.eatType([CompilationEngine.Void])
        const fnName = this.eatIdentifier()
        this.eat('(')
        this.compileParameterList() // zero or more

        // Num of variables the current function uses
        const nVars = this.symTable.varCount('VAR')
        this.writer.writeFunction(`${this.className}.${fnName}`, nVars)

        if (fnType === 'method') {
            this.writer.writePush('ARGUMENT', 0)
            this.writer.writePop('POINTER', 0)
        } else if (fnType === 'constructor') {
            const nArgs = this.symTable.varCount('FIELD')
            this.writer.writePush('CONSTANT', nArgs)
            this.writer.writeCall('Memory.alloc', 1)
            this.writer.writePop('POINTER', 0)
        }

        this.eat(')')

        this.compileSubroutineBody()

        // TODO
        if (fnType === 'constructor') {
            this.writer.writePush('POINTER', 0)
        }

        this.endTag('subroutineDec')

        // recursively eat all the subroutine declarations
        this.compileSubroutine()

    }

    compileParameterList() {
        this.startTag('parameterList')
        if (!CompilationEngine.Types.includes(this.currentToken().value)) {
            return this.endTag('parameterList')
        }
        const type = this.eatType()
        const name = this.eatIdentifier()

        this.symTable.define(
            name,
            type,
            'ARG'
        )

        while (this.currentToken().value === ',') {
            this.eat(',')
            const type = this.eatType()
            const name = this.eatIdentifier()
            this.symTable.define(name, type, 'ARG')
        }
        this.endTag('parameterList')
    }

    compileSubroutineBody() {
        this.startTag('subroutineBody')
        this.eat('{')

        // zero or more
        this.compileVarDec()

        this.compileStatements()

        this.eat('}')
        this.endTag('subroutineBody')
    }

    compileVarDec() {
        const eatVarDec = (function () {
            if ((this.currentToken().value === 'var')) {
                this.startTag('varDec')

                this.eat() // var
                const type = this.eatType()
                const name = this.eatIdentifier()

                this.symTable.define(name, type, 'VAR')

                while (this.currentToken().value === ',') {
                    this.eat(',')
                    const name = this.eatIdentifier()
                    this.symTable.define(name, type, 'VAR')
                }
                this.eat(';')

                this.endTag('varDec')
            }
        }).bind(this)

        eatVarDec()

        while (this.match('var')) {
            eatVarDec()
        }

    }

    compileStatements() {
        this.startTag('statements')
        const eatStatements = (function () {
            // zero or more
            this.compileLet()
            this.compileIf()
            this.compileWhile()
            this.compileDo()
            this.compileReturn()
        }).bind(this)
        eatStatements()

        while (!this.match('}')) {
            eatStatements()
        }
        this.endTag('statements')
    }

    compileLet() {
        if (this.currentToken().value === 'let') {
            this.startTag('letStatement')

            this.eat() // let
            this.eatIdentifier()
            if (this.match('[')) {
                // handling array accessor
                this.eat('[')
                this.compileExpression()
                this.eat(']')
            }
            this.eat('=')
            this.compileExpression()
            this.eat(';')

            this.endTag('letStatement')
        }
    }

    compileIf() {
        if (!this.match('if')) return

        this.startTag('ifStatement')

        this.eat('if')
        this.eat('(')
        this.compileExpression()
        this.eat(')')
        this.eat('{')
        this.compileStatements()
        this.eat('}')

        if (this.match('else')) {
            this.eat('else')
            this.eat('{')
            this.compileStatements()
            this.eat('}')
        }

        this.endTag('ifStatement')
    }

    compileWhile() {
        if (!this.match('while')) return
        this.startTag('whileStatement')
        this.eat('while')
        this.eat('(')
        this.compileExpression()
        this.eat(')')
        this.eat('{')
        this.compileStatements()
        this.eat('}')
        this.endTag('whileStatement')
    }

    compileDo() {
        if (!this.match('do')) return
        this.startTag('doStatement')
        this.eat('do')

        this.compileSubroutineCall()
        this.writer.writePop('TEMP', 0)

        this.eat(';')

        this.endTag('doStatement')
    }

    compileSubroutineCall() {
        const fnOrVarName = this.eatIdentifier() // subroutineName || (className | varName)

        if (this.match('(')) {
            // subroutine call
            this.eat('(')
            this.writer.writePush('POINTER', 0)
            const count = this.compileExpressionList()
            throw new Error('NOT SURE')
            this.writer.writeCall(`${this.className}.${fnOrVarName}`, count + 1)
            this.eat(')')
        } else if (this.match('.')) {
            // is Object.method() call
            this.eat('.')
            let className = fnOrVarName
            const fnName = this.eatIdentifier()

            this.eat('(')
            const nArgs = this.compileExpressionList()

            if (this.symTable.kindOf(className) === 'NONE') {
                // class
                this.writer.writeCall(`${className}.${fnName}`, nArgs)
            } else {
                // instance call
                console.log({className})
                const kind = this.symTable.kindOf(className)
                const index = this.symTable.indexOf(className)
                this.writer.writePush(
                    // @ts-ignore // TODO
                    this.convertKind(kind),
                    index
                )
                this.writer.writeCall(`${className}.${fnName}`, nArgs + 1)
            }

            this.eat(')')
        } else {
            throw new InvalidTokenError(this.currentToken().value)
        }

    }

    compileReturn() {
        if (!this.match('return')) return
        this.startTag('returnStatement')
        this.eat('return')

        if (!this.match(';')) {
            this.compileExpression()
        }
        this.eat(';')

        // TODO
        this.writer.writeReturn()

        this.endTag('returnStatement')
    }

    compileExpression() {
        this.startTag('expression')
        this.compileTerm()

        // (op term)*
        while (CompilationEngine.Operators.includes(this.currentToken().value)) {
            const op = this.eatOperator()
            this.compileTerm()
            if (this.opTable[op]) {
                this.writer.writeArithmetic(this.opTable[op])
            }else if (op === '*') {
                this.writer.writeCall('Math.multiply', 2)
            } else if (op === '/') {
                this.writer.writeCall('Math.divide', 2)
            } else {
                throw new Error('Invalid operator')
            }
        }

        this.endTag('expression')
    }

    compileTerm() {
        this.startTag('term')

        const token = this.currentToken()
        const done = () => this.endTag('term')

        // Single token constants - 1, "string", true
        if (token.type === 'STRING_CONST') {
            const string = this.eat()

            this.writer.writePush('CONSTANT', string.length)
            this.writer.writeCall('String.new', 1)

            string.split("").forEach(char => {
                this.writer.writePush('CONSTANT', char.charCodeAt(0))
                this.writer.writeCall('String.appendChar', 2)
            })

            return done()
        }
        if (token.type === 'INT_CONST') {
            // const token = this.eat()
            this.writer.writePush('CONSTANT', +token.value)
            this.eat()
            return done()
        }
        if (
            CompilationEngine.KeywordConstants.includes(token.value)
        ) {

            if (['true', 'false', 'null'].includes(token.value)) {
                this.writer.writePush('CONSTANT', 0)
                if (token.value === 'true') {
                    this.writer.writeArithmetic('NOT')
                }
            } else if (token.value === 'this') {
                throw new Error('FUCKING')
                this.writer.writePush('POINTER', 0)
            }

            this.eat()
            return done()
        }

        // varName | varName[expression] and not subroutineCall
        if (token.type === 'IDENTIFIER' && !(this.matchNext('(') || this.matchNext('.'))) {
            const varName = this.eatIdentifier() // varName
            if (!this.match('[')) {
                console.log({varName})
                this.symTable.log()
                const kind = this.symTable.kindOf(varName)
                const index = this.symTable.indexOf(varName)
                //@ts-ignore
                this.writer.writePush(this.convertKind(kind), index)
            }
            if (this.match('[')) {
                this.eat('[')
                this.compileExpression()
                this.eat(']')
            }
            return done()
        }

        if (this.match('(')) {
            this.eat('(')
            this.compileExpression()
            this.eat(')')
            return done()
        }

        // unaryOp term
        if (CompilationEngine.UnaryOps.includes(token.value)) {
            const op = this.eatUnaryOp() // '-','~'
            if (op === '-') {
                this.writer.writeArithmetic('NEG')
            } else if (op === '~') {
               this.writer.writeArithmetic('NOT')
            }
            this.compileTerm()
            return done()
        }

        this.compileSubroutineCall()
        return done()
    }

    compileExpressionList() {
        let count = 0
        this.startTag('expressionList')
        if (this.match(')')) {
            this.endTag('expressionList')
            return count
        }

        count++
        this.compileExpression()

        if (this.match(')')) {
            this.endTag('expressionList')
            return count
        }

        while (this.match(',')) {
            this.eat(',')
            count++
            this.compileExpression()
        }

        return count
        this.endTag('expressionList')
    }

}
