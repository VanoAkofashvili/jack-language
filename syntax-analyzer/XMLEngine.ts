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
    const tagName = this.getMapping(XMLEngine.TYPE_MAPPING, token.type)
    const value = this.getMapping(XMLEngine.VALUE_MAPPING, token.value) || token.value
    const tag = `<${tagName}> ${value} </${tagName}>`;
    fs.writeFileSync(this.outputFile, tag + "\n", { flag: "a" });

    return this;
  }

  public end() {
    fs.writeFileSync(this.outputFile, "</tokens>", { flag: "a" });
  }

  private getMapping(MAPPING: Record<string, string>, key: string) {
    if (MAPPING.hasOwnProperty(key)) return MAPPING[key]
    return undefined
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
