import {CompilationEngine} from "../syntax-analyzer/CompilationEngine";
import {JackTokenizer} from "../syntax-analyzer/JackTokenizer";
import {getFiles, getOutputPath, isDirectory} from "../syntax-analyzer/utils";
import {SymbolTable} from "./SymbolTable";
import {VMWriter} from "./VMWriter";


// 1. creates a JackTokenizer from the Xxx.jack input file;
// 2. creates an output file named Xxx.vm; and
// 3. uses a CompilationEngine, a SymbolTable, and a VMWriter for parsing the input
// file and emitting the translated VM code into the output file.

export class JackCompiler {
    constructor(private fileName: string) {
        this.main()
    }

    main() {
        if (isDirectory(this.fileName)) {
            const files = getFiles(this.fileName, ".jack");
            files.forEach((src) => this.processFile(src));
        } else {
            this.processFile(this.fileName);
        }
    }

    private processFile(src: string) {
        const tokenizer = new JackTokenizer(src)
        const symTable = new SymbolTable()

        const outputFile = getOutputPath(src, '.vm')
        const writer = new VMWriter(outputFile)
        const compilationEngine = new CompilationEngine(
            tokenizer,
            symTable,
            writer
        )
        compilationEngine.run()

    }
}


const src = process.argv[2];

if (!src) {
    console.error("Filename not provided");
    process.exit(1);
}

const compiler = new JackCompiler(src)

