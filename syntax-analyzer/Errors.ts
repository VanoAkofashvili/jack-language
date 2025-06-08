import {TokenType} from "./constants";

export class ExpectedIdentifierError extends Error {
    constructor(tokenType: TokenType) {
        super(`Expected identifier, got '${tokenType}'`);
    }
}

export class ExpectedOperatorError extends Error {
    constructor(tokenValue: string) {
        super(`expected operator, got '${tokenValue}'`);
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
