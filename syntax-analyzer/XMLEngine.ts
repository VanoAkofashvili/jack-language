import fs from "fs";
import { Token } from "./constants";

export class XMLEngine {
  private outputFile: string;

  constructor(outputFile: string) {
    this.outputFile = outputFile;

    fs.writeFileSync(outputFile, "");
    fs.writeFileSync(outputFile, "<tokens>\n", { flag: "a" });
  }

  public writeToken(token: Token) {
    const tagName = XMLEngine.TYPE_MAPPING[token.type];
    const value = XMLEngine.VALUE_MAPPING[token.value] || token.value;
    const tag = `<${tagName}>${value}</${tagName}>`;
    fs.writeFileSync(this.outputFile, tag + "\n", { flag: "a" });

    return this;
  }

  public end() {
    fs.writeFileSync(this.outputFile, "</tokens>", { flag: "a" });
  }

  static VALUE_MAPPING = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "&": "&amp;",
  };

  static TYPE_MAPPING = {
    KEYWORD: "keyword",
    SYMBOL: "symbol",
    IDENTIFIER: "identifier",
    INT_CONST: "integerConstant",
    STRING_CONST: "stringConstant",
  };
}
