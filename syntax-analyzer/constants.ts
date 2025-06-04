export const TokenType = {
  KEYWORD: "KEYWORD",
  SYMBOL: "SYMBOL",
  IDENTIFIER: "IDENTIFIER",
  INT_CONST: "INT_CONST",
  STRING_CONST: "STRING_CONST",
} as const;

export class Token {
  constructor(public type: keyof typeof TokenType, public value: string) {}
}

export const Keyword = {
  class: "CLASS",
  method: "METHOD",
  function: "FUNCTION",
  constructor: "CONSTRUCTOR",
  int: "INT",
  boolean: "BOOLEAN",
  char: "CHAR",
  void: "VOID",
  var: "VAR",
  static: "STATIC",
  field: "FIELD",
  let: "LET",
  do: "DO",
  if: "IF",
  else: "ELSE",
  while: "WHILE",
  return: "RETURN",
  true: "TRUE",
  false: "FALSE",
  null: "NULL",
  this: "THIS",
};

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
