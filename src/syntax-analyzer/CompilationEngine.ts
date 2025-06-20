import {getKind, Kind, SymbolTable} from "../compiler/SymbolTable";
import {VMWriter} from "../compiler/VMWriter";
import {TokenTypeMapping} from "./constants";
import {ExpectedIdentifierError, ExpectedOperatorError, InvalidTokenError, InvalidTypeError} from "./Errors";
import {JackTokenizer} from "./JackTokenizer";

export class CompilationEngine {
    private output: string[] = []
    private className: string

    private whileCount = 0
    private ifCount = 0
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
            console.error(`Unexpected token ${token.value}, expected: ${expect}`)
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
        const returnType = this.eatType([CompilationEngine.Void])
        const fnName = this.eatIdentifier()
        this.eat('(')
        this.compileParameterList() // zero or more
        this.eat(')')

        // this.compileSubroutineBody()

        this.startTag('subroutineBody')
        this.eat('{')

        // zero or more
        this.compileVarDec()
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

        this.compileStatements()

        this.eat('}')
        this.endTag('subroutineBody')

        this.endTag('subroutineDec')

        // recursively eat all the subroutine declarations
        this.compileSubroutine()

    }

    compileParameterList() {
        this.startTag('parameterList')
        console.log(
            this.currentToken()
        )
        if (this.match(')')) return
        // if (!CompilationEngine.Types.concat([CompilationEngine.Void]).includes(this.currentToken().value)) {
        //     return this.endTag('parameterList')
        // }
        const type = this.eatType()
        const name = this.eatIdentifier()
        console.log({
            type, name,
            PARAMETER_LIST: true
        })

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
            let name = this.eatIdentifier()
            if (this.match('[')) {


                const kind = this.symTable.kindOf(name)
                const index = this.symTable.indexOf(name)

                this.writer.writePush(
                    //@ts-ignore
                    this.convertKind(kind),
                    index
                )

                // handling array accessor
                this.eat('[')
                this.compileExpression()
                this.writer.writeArithmetic('ADD')
                this.eat(']')

                this.eat('=')
                this.compileExpression()
                this.writer.writePop('TEMP', 0)
                this.writer.writePop('POINTER', 1)
                this.writer.writePush('TEMP', 0)
                this.writer.writePop('THAT', 0)

                this.eat(';')

            } else {
                const kind = this.symTable.kindOf(name)
                const index = this.symTable.indexOf(name)
                this.eat('=')
                this.compileExpression()

                //@ts-ignore
                this.writer.writePop(this.convertKind(kind), index)
                this.eat(';')
            }


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

        let l1 = `IF_TRUE${this.ifCount}`
        let l2 = `IF_FALSE${this.ifCount}`
        let l3 = `IF_END${this.ifCount}`
        this.writer.writeIf(l1)
        this.writer.writeGoto(l2)
        this.writer.writeLabel(l1)
        this.ifCount++

        this.eat('{')
        this.compileStatements()
        this.writer.writeGoto(l3)
        this.eat('}')
        this.writer.writeLabel(l2)

        if (this.match('else')) {
            this.eat('else')
            this.eat('{')
            this.compileStatements()
            this.eat('}')
        }


        this.writer.writeLabel(l3)
        this.endTag('ifStatement')
    }

    compileWhile() {
        if (!this.match('while')) return
        this.startTag('whileStatement')
        this.eat('while')

        let l1 = `WHILE_EXP${this.whileCount}`
        let l2 = `WHILE_END${this.whileCount}`
        this.whileCount++
        this.writer.writeLabel(l1)

        this.eat('(')
        this.compileExpression()
        this.writer.writeArithmetic('NOT')
        this.eat(')')
        this.eat('{')

        this.writer.writeIf(l2)

        this.compileStatements()
        this.writer.writeGoto(l1)
        this.writer.writeLabel(l2)
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

        // do game.run()
        if (this.match('(')) {
            // subroutine call
            this.eat('(')
            this.writer.writePush('POINTER', 0)
            const count = this.compileExpressionList()
            // throw new Error('NOT SURE')
            this.writer.writeCall(`${this.className}.${fnOrVarName}`, count + 1)
            this.eat(')')
        } else if (this.match('.')) {
            // is ClassName.fnName(arg1) call
            this.eat('.')
            let className = fnOrVarName
            const fnName = this.eatIdentifier()

            this.eat('(')
            const nArgs = this.compileExpressionList()

            if (this.symTable.kindOf(className) === 'NONE') {
                // class
                this.writer.writeCall(`${className}.${fnName}`, nArgs)
            } else {
                // is game.run(arg1) call
                // instance call
                const kind = this.symTable.kindOf(className)
                const index = this.symTable.indexOf(className)
                const type = this.symTable.typeOf(className)
                this.writer.writePush(
                    // @ts-ignore // TODO
                    this.convertKind(kind),
                    index
                )
                this.writer.writeCall(`${type}.${fnName}`, nArgs + 1)
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
        } else {
            this.writer.writePush('CONSTANT', 0)
        }
        this.eat(';')

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
            } else if (op === '*') {
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
                this.writer.writePush('POINTER', 0)
            }

            this.eat()
            return done()
        }

        // varName | varName[expression] and not subroutineCall
        if (token.type === 'IDENTIFIER' && !(this.matchNext('(') || this.matchNext('.'))) {
            const varName = this.eatIdentifier() // varName
            if (!this.match('[')) {
                const kind = this.symTable.kindOf(varName)
                const index = this.symTable.indexOf(varName)
                //@ts-ignore
                this.writer.writePush(this.convertKind(kind), index)
            }
            if (this.match('[')) {
                this.eat('[')
                this.compileExpression()
                this.eat(']')

                const type = this.symTable.typeOf(varName)
                const kind = this.symTable.kindOf(varName)
                const index = this.symTable.indexOf(varName)
                this.writer.writePush(
                    //@ts-ignore
                    this.convertKind(kind),
                    index
                )
                this.writer.writeArithmetic('ADD')
                this.writer.writePop('POINTER', 1)
                this.writer.writePush('THAT', 0)
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
            this.compileTerm()
            if (op === '-') {
                this.writer.writeArithmetic('NEG')
            } else if (op === '~') {
                this.writer.writeArithmetic('NOT')
            }
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

        this.compileExpression()
        count++

        if (this.match(')')) {
            this.endTag('expressionList')
            return count
        }

        while (this.match(',')) {
            this.eat(',')
            this.compileExpression()
            count++
        }

        return count
        this.endTag('expressionList')
    }

}
