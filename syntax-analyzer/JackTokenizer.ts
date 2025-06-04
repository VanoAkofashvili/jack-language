import fs from "fs";
import {
  Keyword,
  KEYWORDS,
  STRING_MATCHER,
  SYMBOLS,
  Token,
  TokenType,
} from "./constants";

// incapsulate the src
export class JackTokenizer {
  private content: string;
  private tokens: Token[] = [];

  private cursor: number = 0;

  constructor(src: string) {
    this.content = fs.readFileSync(src).toString("utf-8");
    this.scanTokens();
  }

  // TODO
  public getTokens() {
    return this.tokens;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.scanSingleToken();
    }
  }

  scanSingleToken() {
    const c = this.advance();

    if (SYMBOLS.includes(c)) {
      this.addToken(TokenType.SYMBOL, c);
    } else if (c === STRING_MATCHER) {
      this.addToken(TokenType.STRING_CONST, this.getString());
    } else if (this.isDigit(c)) {
      this.addToken(TokenType.INT_CONST, this.getDigit(c));
    } else {
      if (this.isAlpha(c)) {
        this.getIdentifierAndKeywords(c);
      }
    }
  }

  private getIdentifierAndKeywords(starting: string) {
    let identifier = starting;

    let c = this.advance();
    while (this.isAlphaNumeric(c)) {
      identifier += c;
      c = this.advance();
    }
    if (KEYWORDS.includes(identifier)) {
      this.addToken(TokenType.KEYWORD, identifier);
    } else {
      this.addToken(TokenType.IDENTIFIER, identifier);
    }
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

  private getDigit(starting: string) {
    let digit = starting;

    let c = this.advance();
    while (this.isDigit(c)) {
      digit += c;
      c = this.advance();
    }

    return digit;
  }

  private peek() {
    return this.content.charAt(this.cursor);
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
