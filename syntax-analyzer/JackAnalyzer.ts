import { isDirectory, getFiles, getOutputPath } from "./utils";
// input - fileName.jack or directory

import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";

// output - fileName.xml or one xml for every jack
export class JackAnalyzer {
  constructor(src: string) {
    if (isDirectory(src)) {
      // TODO
    } else {
      this.processFile(src);
    }
  }

  processFile(filename: string) {
    const tokenizer = new JackTokenizer(filename);
    const compilationEngine = new CompilationEngine();
    const output = getOutputPath(filename);
    console.log(tokenizer.advance());
    console.log(output, "output");
  }
}
