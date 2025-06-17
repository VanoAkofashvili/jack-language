export const TokenType = {
  KEYWORD: "KEYWORD",
  SYMBOL: "SYMBOL",
  IDENTIFIER: "IDENTIFIER",
  INT_CONST: "INT_CONST",
  STRING_CONST: "STRING_CONST",
} as const;
export type TokenType = keyof typeof TokenType;

export class Token {
  constructor(public type: TokenType, public value: string) {}
}

export const TokenTypeMapping= {
  KEYWORD: "keyword",
  SYMBOL: "symbol",
  IDENTIFIER: "identifier",
  INT_CONST: "integerConstant",
  STRING_CONST: "stringConstant",
};


export const IdentifierType = {
  STATIC: 'STATIC',
  FIELD: 'FIELD',
  ARG: 'ARG',
  VAR: 'VAR'
}

export const SYMBOLS = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "<",
  ">",
  "=",
  "~",
];

export const KEYWORDS = [
  "class",
  "constructor",
  "function",
  "method",
  "field",
  "static",
  "var",
  "int",
  "char",
  "boolean",
  "void",
  "true",
  "false",
  "null",
  "this",
  "let",
  "do",
  "if",
  "else",
  "while",
  "return",
];

export const STRING_MATCHER = `"`;
