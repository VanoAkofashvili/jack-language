import {TokenType, TokenTypeMapping} from "./constants";
import {ExpectedIdentifierError, InvalidTokenError, InvalidTypeError} from "./Errors";
import {JackTokenizer} from "./JackTokenizer";

export class CompilationEngine {
  private output: string[] = []

  constructor(private tokenizer: JackTokenizer) {
    this.tokenizer.advance()
    this.compileClass()
  }


  static Types = ['int', 'char', 'boolean']
  static Void = 'void'

  public getTree() {
    return this.output
  }

  private currentToken() {
    return this.tokenizer.getCurrentToken()
  }


  private eat(expect?: string) {
    const token = this.currentToken()
    console.log('IN EAT: ', token)

    if (expect && (expect !== token.value)) {
      throw new InvalidTokenError(token.value)
    }

    const representation = TokenTypeMapping[token.type]

    this.tag(representation, token.value)
    this.tokenizer.advance()
  }

  private eatIdentifier() {
    const token = this.currentToken()
    if (token.type !== 'IDENTIFIER') {
      throw new ExpectedIdentifierError(token.type)
    }
    this.eat()
  }

  public eatType(expansionList?: string[]) {
    const token = this.currentToken()

    if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
      const typesToCheck = CompilationEngine.Types.concat(expansionList)

      if (typesToCheck.includes(token.value) || token.type === 'IDENTIFIER') {
        this.tag(TokenTypeMapping[token.type], token.value)
        this.tokenizer.advance()
      } else {
        throw new InvalidTypeError(token.value)
      }
    } else {
      throw new InvalidTokenError(token.value)
    }

  }

  private match(expect: string) {
    return this.currentToken().value === expect
  }


  private startTag(tag: string) {
    this.write(`<${tag}>`)
  }
  private tag(tag: string, value: string) {
    this.write(`<${tag}> ${value} </${tag}>`)
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
    this.eatIdentifier() // className
    this.eat('{')

    this.compileClassVarDec() // zero or one
    this.compileSubroutine() // zero or one

    this.eat('}')
    this.endTag('class')


  }
  compileClassVarDec() {
    const currentToken =this.currentToken()


    if (!(['static', 'field'].includes(currentToken.value))) return

    this.startTag('classVarDec')

    this.eat() // static | field
    this.eatType() // int | boolean | ...
    this.eat() // varName

    while(this.currentToken().value === ',') {
      this.eat(',')
      this.eatIdentifier()
    }
    this.eat(';')
    this.endTag('classVarDec')
  }
  compileSubroutine() {
    if (!(['constructor', 'function', 'method'].includes(this.currentToken().value))) return
    this.startTag('subroutineDec')

    this.eat() // keyword - method type
    // eat common types + void
    this.eatType([CompilationEngine.Void])
    this.eatIdentifier()
    this.eat('(')
    this.compileParameterList() // zero or more
    this.eat(')')

    this.compileSubroutineBody()

    this.endTag('subroutineDec')

    // recursively eat all the subroutine declarations
    this.compileSubroutine()

  }
  compileParameterList() {
    this.startTag('parameterList')
    if (!CompilationEngine.Types.includes(this.currentToken().value)) {
      return this.endTag('parameterList')
    }
    this.eatType()
    this.eatIdentifier()


    while(this.currentToken().value === ',') {
      this.eat(',')
      this.eatType()
      this.eatIdentifier()
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

    if ((this.currentToken().value === 'var')) {
      this.startTag('varDec')

      this.eat() // var
      this.eatType()
      this.eatIdentifier()

      while(this.currentToken().value === ',') {
        this.eat(',')
        this.eatIdentifier()
      }
      this.eat(';')

      this.endTag('varDec')
    }
  }
  compileStatements() {
    this.startTag('statements')
    const eatStatements = (function() {
      // zero or more
      this.compileLet()
      this.compileIf()
      this.compileWhile()
      this.compileDo()
      this.compileReturn()
    }).bind(this)
    eatStatements()

    while(!this.match('}')) {
      eatStatements()
    }
    this.endTag('statements')
  }
  compileLet() {
    if (this.currentToken().value === 'let') {
      this.startTag('letStatement')

      this.eat() // let
      this.eatIdentifier()
      this.eat('=')
      // this.eatIdentifier()
      this.compileExpression() // TODO
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
  compileWhile(){
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
    // TODO
    if (!this.match('do')) return
    this.startTag('doStatement')
    this.eat('do')


    this.eatIdentifier() // subroutine name | className | varName

    if (this.match('(')) {
      // subroutine call
      this.eat('(')
      this.compileExpressionList()
      this.eat(')')
    } else if (this.match('.')) {
      this.eat('.')
      this.eatIdentifier()
      this.eat('(')
      this.compileExpressionList()
      this.eat(')')
    } else {
      throw new InvalidTokenError(this.currentToken().value)
    }

    this.eat(';')

    this.endTag('doStatement')
  }
  compileReturn() {
    if (!this.match('return')) return
    this.startTag('returnStatement')
    this.eat('return')

    if (!this.match(';')) {
      this.compileExpression()
    }
    this.eat(';')

    this.endTag('returnStatement')
  }
  compileExpression() {
    this.startTag('expression')
    this.compileTerm()
    this.endTag('expression')
  }
  compileTerm() {
    this.startTag('term')
    this.eatIdentifier() // TODO
    this.endTag('term')
  }
  compileExpressionList() {
    this.startTag('expressionList')
    if (this.match(')')) {
      this.endTag('expressionList')
      return
    }
    this.compileExpression()
    // TODO: handle multiple expressions
    this.endTag('expressionList')
  }

}
