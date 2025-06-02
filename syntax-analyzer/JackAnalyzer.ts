// input - fileName.jack or directory

import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";

// output - fileName.xml or one xml for every jack
export class JackAnalyzer {
  constructor(src: any) {
    console.log("Init Jack analyzer");
  }

  processFile() {
    const tokenizer = new JackTokenizer();
    // create output file

    const compilationEngine = new CompilationEngine();
  }
}
