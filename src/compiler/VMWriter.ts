import {writeFileSync} from 'fs'

export const SEGMENT = {
    CONSTANT: 'CONSTANT',
    ARGUMENT: 'ARGUMENT',
    LOCAL: 'LOCAL',
    STATIC: 'STATIC',
    THIS: 'THIS',
    THAT: 'THAT',
    POINTER: 'POINTER',
    TEMP: 'TEMP',
}
type Segment = keyof typeof SEGMENT

export const ARITHMETIC_CMD = {
    ADD: 'ADD',
    SUB: 'SUB',
    NEG: 'NEG',
    EQ: 'EQ',
    GT: 'GT',
    LT: 'LT',
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT'
}
type ArithmeticCMD = keyof typeof ARITHMETIC_CMD

export class VMWriter {
    private commands: string[] = []

    constructor(private output: string) {
    }

    private write(cmd: string) {
        this.commands.push(cmd)
    }

    writePush(segment: Segment, index: number) {
        this.write(`push ${segment.toLowerCase()} ${index}`)
    }

    writePop(segment: Segment, index: number) {
        this.write(`pop ${segment.toLowerCase()} ${index}`)
    }

    writeArithmetic(command: ArithmeticCMD) {
        this.write(command.toLowerCase())
    }

    writeLabel(label: string) {
        this.write(`label ${label}`)
    }

    writeGoto(label: string) {
        this.write(`goto ${label}`)
    }

    writeIf(label: string) {
        this.write(`if-goto ${label}`)
    }

    writeCall(name: string, nArgs: number) {
        this.write(`call ${name} ${nArgs}`)
    }

    writeFunction(name: string, nVars: number) {
        this.write(`function ${name} ${nVars}`)
    }

    writeReturn() {
        this.write(`return`)
    }

    close() {
        writeFileSync(
            this.output,
            this.commands.join('\n')
        )
    }
}

