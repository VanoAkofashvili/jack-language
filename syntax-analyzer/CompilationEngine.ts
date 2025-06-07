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

  private eat(expect?: string) {
    const token = this.tokenizer.getCurrentToken()

    if (expect && (expect !== token.value)) {
      throw new InvalidTokenError(token.value)
    }

    const representation = TokenTypeMapping[token.type]

    this.tag(representation, token.value)
    this.tokenizer.advance()
  }

  private eatIdentifier() {
    const token = this.tokenizer.getCurrentToken()
    if (token.type !== 'IDENTIFIER') {
      throw new ExpectedIdentifierError(token.type)
    }
    this.eat()
  }

  public eatType() {
    const token = this.tokenizer.getCurrentToken()

    if (token.type !== 'KEYWORD') throw new InvalidTokenError(token.value)

    if (['int', 'char', 'boolean'].includes(token.value)) {
      this.tag(TokenTypeMapping.KEYWORD, token.value)
      this.tokenizer.advance()
    } else {
      throw new InvalidTypeError(token.value)
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
    // this.compileSubroutine() // zero or one

    // this.eat('}')
    this.endTag('class')

  }
  compileClassVarDec() {
    const currentToken = this.tokenizer.getCurrentToken()


    if (!(['static', 'field'].includes(currentToken.value))) return

    this.startTag('classVarDec')

    this.eat() // static | field
    this.eatType() // int | boolean | ...
    this.eat() // varName

    while(this.tokenizer.getCurrentToken().value === ',') {
      this.eat(',')
      this.eatIdentifier()
    }
    this.eat(';')
    this.endTag('classVarDec')
  }
  compileSubroutine() {}
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
