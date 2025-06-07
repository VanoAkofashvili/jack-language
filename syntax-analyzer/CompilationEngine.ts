import {TokenType, TokenTypeMapping} from "./constants";
import {ExpectedIdentifierError, InvalidTokenError, InvalidTypeError} from "./Errors";
import {JackTokenizer} from "./JackTokenizer";

export class CompilationEngine {
  private output: string[] = []

  constructor(private tokenizer: JackTokenizer) {
    console.log(tokenizer.getTokens())

    this.tokenizer.advance()
    this.compileClass()
    console.log(this.output)
  }

  static Types = ['int', 'char', 'boolean']
  static Void = 'void'

  private currentToken() {
    return this.tokenizer.getCurrentToken()
  }

  private eat(expect?: string) {
    const token = this.currentToken()

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

  public eatType(expansionList?: string[], config?: { allowAnyType: boolean }) {
    const token = this.currentToken()

    console.log({token})
    if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
      const typesToCheck = CompilationEngine.Types.concat(expansionList)

      if (config?.allowAnyType || typesToCheck.includes(token.value)) {
        this.tag(TokenTypeMapping[token.type], token.value)
        this.tokenizer.advance()
      } else {
        throw new InvalidTypeError(token.value)
      }
    } else {
      throw new InvalidTokenError(token.value)
    }


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

    // this.eat('}')
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
    this.eat() // keyword - method type


    // eat common types + void
    this.eatType([CompilationEngine.Void], {allowAnyType: true})
    this.eatIdentifier()
    this.eat('(')
    // //TODO: handle parameter list
    // this.compileParameterList() // zero or more
    this.eat(')')
    this.eat('{')

    // TODO
    // this.compileSubroutineBody()

    // this.eat('}')


  }
  compileParameterList() {}
  compileSubroutineBody() {}
  compileVarDec() {}
  compileStatements() {}
  compileLet() {}
  compileIf() {}
  compileWhile(){}
  compileDo() {}
  compileReturn() {}
  compileExpression() {}
  compileTerm() {}
  compileExpressionList() {}

}
