import fs from "fs";
import {
  KEYWORDS,
  STRING_MATCHER,
  SYMBOLS,
  Token,
  TokenType,
} from "./constants";

export class JackTokenizer {
  private content: string;
  private tokens: Token[] = [];

  private cursor: number = 0;
  private start: number = 0


  private currentTokenIndex:number = -1;

  constructor(src: string) {
    this.content = fs.readFileSync(src).toString("utf-8");
    this.scanTokens();
  }

  public getNextThreeToken(){
    return this.tokens.slice(this.currentTokenIndex, this.currentTokenIndex + 3);
  }

  public hasMoreTokens() {
    return this.currentTokenIndex < this.tokens.length
  }

  public advance() {
    this.currentTokenIndex++
  }

  public getCurrentToken() {
    return this.tokens[this.currentTokenIndex]
  }

  public getTokens() {
    return this.tokens
  }


  private  scanTokens() {
    while (!this.isAtEnd()) {
      // start parsing the next token
      this.start = this.cursor
      this.scanSingleToken();
    }
  }

  private scanSingleToken() {
    // current char
    const c = this._advance()

    if (c === "/" && ["/", "*"].some(this.match.bind(this)))
      return this.consumeComment();

    if (SYMBOLS.includes(c)) {
      return this.addToken(TokenType.SYMBOL, c)
    }

    if (c === STRING_MATCHER)
      this.addToken(TokenType.STRING_CONST, this.getString());

    if (this.isDigit(c))
      return this.addToken(TokenType.INT_CONST, this.getDigit());

    if (this.isAlpha(c)) return this.getIdentifierAndKeywords();

  }

  private consumeComment() {
    let c = this._advance();

    switch (c) {
      case "/":
        return this.consumeLineComment();
      case "*":
        return this.consumeBlockComment();
      default:
        throw new Error("Maybe syntax error?");
    }
  }

  private consumeLineComment() {
    while (this.peek() !== "\n" && !this.isAtEnd()) this._advance();
  }

  private consumeBlockComment() {
    let c = this._advance();

    while (true) {
      // end of block comment
      if (c === "*" && this.match("/")) break;
      c = this._advance();
    }
    this._advance();
  }

  private getIdentifierAndKeywords() {

    while(this.isAlphaNumeric(this.peek())) this._advance()

    const identifier = this.content.substring(
        this.start,
        this.cursor
    )


    if (KEYWORDS.includes(identifier)) {
      this.addToken(TokenType.KEYWORD, identifier);
    }
    else
      this.addToken(TokenType.IDENTIFIER, identifier);

  }

  private getString() {
    let str = "";
    let c = this._advance();
    while (c !== STRING_MATCHER) {
      str += c;
      c = this._advance();
    }
    return str;
  }

  private getDigit() {
    while (this.isDigit(this.peek())) this._advance();
    const digit = this.content.substring(
        this.start,
        this.cursor
    )
    console.log({digit})
    return digit
  }

  private peek() {
    return this.content.charAt(this.cursor);
  }

  private match(expect: string) {
    return this.content.charAt(this.cursor) === expect;
  }

  private isAtEnd() {
    return this.cursor >= this.content.length;
  }

  private _advance() {
    return this.content.charAt(this.cursor++);
  }



  // tokenType() {
  //   // return type of current token
  //   return TokenType.SYMBOL;
  // }
  //
  // // only if tokenType is KEYWORD
  // keyword() {
  //   return Keyword.boolean;
  // }

  // // only if tokenType is SYMBOL
  // symbol() {
  //   return "{";
  // }
  //
  // // only if tokenType is IDENTIFIER
  // identifier() {
  //   //return string which is the current token
  // }
  //
  // // INT_CONST
  // intVal() {}
  //
  // // STRING_CONST
  // stringVal() {}

  private addToken(tokenType: keyof typeof TokenType, value: string) {
    this.tokens.push(new Token(tokenType, value));
  }

  private isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  private isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }
}
