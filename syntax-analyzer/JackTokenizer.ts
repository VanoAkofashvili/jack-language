import fs from "fs";
import {
  Keyword,
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

  constructor(src: string) {
    this.content = fs.readFileSync(src).toString("utf-8");
    this.scanTokens();
  }

  public getTokens() {
    return this.tokens;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      // start parsing the next token
      this.start = this.cursor
      this.scanSingleToken();
    }
  }

  scanSingleToken() {
    // current char
    const c = this.advance()

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
    let c = this.advance();

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
    while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
  }

  private consumeBlockComment() {
    let c = this.advance();

    while (true) {
      // end of block comment
      if (c === "*" && this.match("/")) break;
      c = this.advance();
    }
    this.advance();
  }

  private getIdentifierAndKeywords() {

    while(this.isAlphaNumeric(this.peek())) this.advance()

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
    let c = this.advance();
    while (c !== STRING_MATCHER) {
      str += c;
      c = this.advance();
    }
    return str;
  }

  private getDigit() {
    while (this.isDigit(this.peek())) this.advance();
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

  hasMoreTokens() {}

  advance() {
    return this.content.charAt(this.cursor++);
  }

  tokenType() {
    // return type of current token
    return TokenType.SYMBOL;
  }

  // only if tokenType is KEYWORD
  keyword() {
    return Keyword.boolean;
  }

  // only if tokenType is SYMBOL
  symbol() {
    return "{";
  }

  // only if tokenType is IDENTIFIER
  identifier() {
    //return string which is the current token
  }

  // INT_CONST
  intVal() {}

  // STRING_CONST
  stringVal() {}

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
