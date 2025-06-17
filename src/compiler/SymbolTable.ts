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
    // private symbolTable = new Map<, TableEntry>()
    private symbolTable: Record<string, TableEntry> = {}

    constructor() {
    }

    private getEntry(name: string, reportError = true): TableEntry {
        if (this.symbolTable[name]) {
            return this.symbolTable[name]
        }

        if (reportError) {
            throw new Error(`Variable '${name}' not found`)
        }
    }

    reset() {
        // TODO: not sure
        this.symbolTable = {};
    }

    define(
        name: string,
        type: string,
        kind: Kind
    ) {
        if (this.getEntry(name), false) {
            throw new Error(`Variable '${name}' is already defined`)
        }
        const newIndex = this.varCount(kind) + 1
        const entry = new TableEntry(
            name,
            type,
            kind,
            newIndex
        )
        this.symbolTable[name] = entry
    }

    varCount(kind: Kind) {
        return Object.values(this.symbolTable).reduce((acc, curr) => {
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
}
