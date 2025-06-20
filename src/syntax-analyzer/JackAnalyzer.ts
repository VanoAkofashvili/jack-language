import fs from 'fs'
import {CompilationEngine} from "./CompilationEngine";
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
    const tokenizer = new JackTokenizer(filename)

    let compilationEngine = new CompilationEngine(tokenizer)
    try {

      compilationEngine.run()

    } catch(err) {

      console.log('compiled: ', compilationEngine.getTree())
      console.log(err)

    }

    fs.writeFileSync(getOutputPath(filename), compilationEngine.getTree().join('\n'))

  }
}
