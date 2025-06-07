import {TokenType} from "./constants";

export class ExpectedIdentifierError extends Error {
    constructor(tokenType: TokenType) {
        super(`Unexpected token type '${tokenType}', expected 'IDENTIFIER'`);
    }
}

export class InvalidTokenError extends Error {
    constructor(tokenValue: string) {
        super(`Invalid token ${tokenValue}`);
    }
}

export class InvalidTypeError extends Error {
    constructor(tokenValue: string) {
        super(`Expected type, got ${tokenValue}`);
    }
}
