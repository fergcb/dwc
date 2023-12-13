import { Peekable } from "./iterator.ts";
import { none, Option, some } from "./option.ts";
import { Position } from "./lib/position.js";

export enum TokenKind {
  // Keywords
  Let = "let",
  // Operators
  Assign = "=",
  // Punctuation
  Semicolon = ";",
  LParen = "(",
  RParen = ")",
  // Values
  Ident = "Ident",
  Integer = "Integer",
  // Special
  EOF = "EOF",
  Error = "Error",
}

export class Token {
  constructor(
    public readonly kind: TokenKind,
    public readonly text: string,
    public readonly pos: Position,
  ) {}

  public toString() {
    switch (this.kind) {
      case TokenKind.Let:
        return "let";
      case TokenKind.Assign:
        return "=";
      case TokenKind.Semicolon:
        return ";";
      case TokenKind.LParen:
        return "(";
      case TokenKind.RParen:
        return ")";
      case TokenKind.Ident:
        return `Ident(${this.text})`;
      case TokenKind.Integer:
        return `Integer(${this.text})`;
      case TokenKind.EOF:
        return `EOF`;
      case TokenKind.Error:
        return `Error(${this.text})`;
    }
  }
}

const keywords: Record<string, TokenKind> = {
  let: TokenKind.Let,
};

function isIdentStartChar(ch: string): boolean {
  return /^[a-zA-Z_]$/.test(ch);
}

function isIdentChar(ch: string): boolean {
  return /^[a-zA-Z_0-9]/.test(ch);
}

function isDigit(ch: string): boolean {
  return /^\d$/.test(ch);
}

export class Lexer extends Peekable<Token> {
  private offset = 0;
  private pointer = 0;
  private ch!: string;

  constructor(
    public readonly input: string,
    public readonly sourceName: string,
  ) {
    super();
    this.advance();
  }

  public getOffset(): number {
    return this.offset;
  }

  private createToken(
    kind: TokenKind,
    text: string,
    offset: number = this.offset,
  ): Token {
    return new Token(kind, text, {
      offset,
      length: text.length,
      sourceName: this.sourceName,
    });
  }

  protected _next(): Option<Token> {
    this.skipWhitespace();

    return this.readSymbol()
      .orElse(() => this.readIdent())
      .orElse(() => this.readInteger());
  }

  private advance(): void {
    this.ch = this.input.at(this.pointer) ?? "\0";
    this.offset = this.pointer;
    this.pointer += 1;
  }

  private skipWhitespace() {
    while (/^\s$/.test(this.ch)) this.advance();
  }

  private readSymbol(): Option<Token> {
    let tok = none();

    switch (this.ch) {
      case "=":
        tok = some(this.createToken(TokenKind.Assign, this.ch));
        break;
      case ";":
        tok = some(this.createToken(TokenKind.Semicolon, this.ch));
        break;
      case "(":
        tok = some(this.createToken(TokenKind.LParen, this.ch));
        break;
      case ")":
        tok = some(this.createToken(TokenKind.RParen, this.ch));
        break;
      case "\0":
        tok = some(this.createToken(TokenKind.EOF, this.ch));
        this.done = true;
        break;
    }

    if (tok.isSome()) this.advance();

    return tok;
  }

  private readIdent(): Option<Token> {
    if (!isIdentStartChar(this.ch)) return none();

    const start = this.offset;
    while (isIdentChar(this.ch)) this.advance();

    const ident = this.input.slice(start, this.offset);
    const kind = ident in keywords ? keywords[ident] : TokenKind.Ident;

    return some(this.createToken(kind, ident, start));
  }

  private readInteger(): Option<Token> {
    if (!isDigit(this.ch)) return none();

    const start = this.offset;
    while (isDigit(this.ch)) this.advance();
    const int = this.input.slice(start, this.offset);
    return some(this.createToken(TokenKind.Integer, int, start));
  }
}
