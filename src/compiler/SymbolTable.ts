import {IdentifierType} from "../syntax-analyzer/constants";

type Kind = keyof typeof IdentifierType;

class TableEntry {
    constructor(
        public name: string,
        public type: string,
        public kind: Kind,
        public index: number,
    ) {
    }
}

export class SymbolTable {
    private classTable: Record<string, TableEntry> = {}
    private subroutineTable: Record<string, TableEntry> = {}

    constructor() {
    }

    private getClassEntry(name: string) {
       return this.classTable[name]
    }
    private getSubroutineEntry(name: string) {
        return this.subroutineTable[name]
    }
    private getEntry(name: string, reportError = true): TableEntry {
        let entry = this.getSubroutineEntry(name) || this.getClassEntry(name)

        if (entry) return entry

        if (reportError) {
            throw new Error(`Variable '${name}' not found`)
        }
    }

    reset() {
        this.subroutineTable = {}
    }

    define(
        name: string,
        type: string,
        kind: Kind
    ) {
        const newIndex = this.varCount(kind)
        const entry = new TableEntry(
            name,
            type,
            kind,
            newIndex
        )
        if (kind === 'STATIC' || kind === 'FIELD') {
            this.classTable[name] = entry
        } else {
            this.subroutineTable[name] = entry
        }
    }

    varCount(kind: Kind) {
        return Object.values(this.subroutineTable).concat(Object.values(this.classTable)).reduce((acc, curr) => {
            return curr.kind === kind ? acc + 1 : acc
        }, 0)
    }

    kindOf(name: string): Kind | "NONE" {
        return this.getEntry(name).kind || 'NONE'
    }

    typeOf(name: string): string {
        return this.getEntry(name).type
    }

    indexOf(name: string): number {
        return this.getEntry(name).index
    }

    log() {
        console.log({
            classTable: this.classTable,
            subroutineTable: this.subroutineTable,
        })
    }
}
