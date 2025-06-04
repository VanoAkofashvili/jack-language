import { isDirectory, getFiles, getOutputPath } from "./utils";
// input - fileName.jack or directory

import { JackTokenizer } from "./JackTokenizer";
import { XMLEngine } from "./XMLEngine";

// output - fileName.xml or one xml for every jack
export class JackAnalyzer {
  constructor(src: string) {
    if (isDirectory(src)) {
      const files = getFiles(src, ".jack");
      files.forEach((src) => this.processFile(src));
    } else {
      this.processFile(src);
    }
  }

  processFile(filename: string) {
    const tokenizer = new JackTokenizer(filename);
    const xmlEngine = new XMLEngine(getOutputPath(filename));

    tokenizer.getTokens().forEach((token) => {
      xmlEngine.writeToken(token);
    });

    xmlEngine.end();
  }
}
