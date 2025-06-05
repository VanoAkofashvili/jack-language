import { isDirectory, getFiles, getOutputPath } from "./utils";
// input - fileName.jack or directory

import { JackTokenizer } from "./JackTokenizer";
import { XMLEngine } from "./XMLEngine";

// output - fileName.xml or one xml for every jack
export class JackAnalyzer {
  constructor(private src: string) {}

  public run() {
    if (isDirectory(this.src)) {
      const files = getFiles(this.src, ".jack");
      files.forEach((src) => this.processFile(src));
    } else {
      this.processFile(this.src);
    }
  }

  private processFile(filename: string) {
    const tokenizer = new JackTokenizer(filename);
    const xmlEngine = new XMLEngine(getOutputPath(filename));

    tokenizer.getTokens().forEach((token) => {
      xmlEngine.writeToken(token);
    });

    xmlEngine.end();
  }
}
