import {
  CallExpr,
  Expression,
  ExpressionStmt,
  IdentifierExpr,
  IntegerExpr,
  Program,
  Statement,
  VariableDeclarationStmt,
} from "./ast.ts";
import { Lexer, Token, TokenKind } from "./lexer.ts";
import { none, type Option, some } from "./option.ts";
import * as JS from "npm:@types/estree";

function jsPositionToString(pos: JS.Position): string {
  return `Ln ${pos.line}, Col ${pos.column}`;
}

class ParserError extends Error {}

export class Parser {
  private current!: Token;
  private readonly tokens: Lexer;
  private readonly lineLengths: number[];

  constructor(
    private readonly input: string,
    private readonly sourceName: string,
  ) {
    this.tokens = new Lexer(input, sourceName);
    this.lineLengths = input.split(/[\n\r]+/g)
      .map((line) => line.length);
    this.advance();
  }

  private advance(): void {
    this.tokens.next();
    this.current = this.tokens.current()
      .unwrapOr(
        new Token(TokenKind.EOF, "\0", {
          offset: this.input.length,
          length: 0,
          sourceName: this.sourceName,
        }),
      );
  }

  private offsetToJSPosition(offset: number): JS.Position {
    let line = 0;
    let column = offset;
    while (line < this.lineLengths.length && column > this.lineLengths[line]) {
      column -= this.lineLengths[line] + 1;
      line += 1;
    }

    line += 1;
    return { line, column };
  }

  private tokenError(expected: TokenKind | string): Error {
    const actual = this.current;
    const pos = jsPositionToString(
      this.offsetToJSPosition(actual.pos.offset),
    );
    return new ParserError(
      `Expected '${expected}', found '${actual}' at ${pos} (${actual.pos.offset}) at ${actual.pos.sourceName}.`,
    );
  }

  private parseToken(kind: TokenKind, consume = false): Token {
    return this.tokens.current()
      .filter((tok) => tok.kind === kind)
      .ifPresent(() => {
        if (consume) this.tokens.next();
      })
      .unwrapOrElseThrow(() => this.tokenError(kind));
  }

  private peekToken(kind: TokenKind): Option<Token> {
    return this.tokens.peek().filter((tok) => tok.kind === kind);
  }

  public parseProgram(): [Program, ParserError[]] {
    const stmts = [];
    const errs = [];

    while (!this.tokens.isDone()) {
      try {
        const stmt = this.parseStatement();
        stmts.push(stmt);
        // console.log("Parsed a", stmt.constructor.name);
      } catch (err) {
        if (err instanceof ParserError) errs.push(err);
        else throw err;
      }
    }

    return [
      new Program(stmts, {
        offset: 0,
        length: this.input.length,
        sourceName: this.sourceName,
      }),
      errs,
    ];
  }

  private parseStatement(): Statement {
    return (this.parseVariableDeclarationStmt() as Option<Statement>)
      .orElse(() => this.parseExpressionStmt())
      .ifPresent(() => this.parseToken(TokenKind.Semicolon, true))
      .unwrapOrElseThrow(() => this.tokenError("Statement"));
  }

  private parseVariableDeclarationStmt(): Option<VariableDeclarationStmt> {
    const start = this.tokens.getOffset();

    this.parseToken(TokenKind.Let, true);

    const ident = this.parseToken(TokenKind.Ident, true);

    this.parseToken(TokenKind.Assign, true);

    const value = this.parseExpression()
      .unwrapOrElseThrow(() => this.tokenError("Expression"));
    this.advance();

    const end = this.tokens.getOffset();

    return some(
      new VariableDeclarationStmt(ident.text, value, false, {
        offset: start,
        length: end - start,
        sourceName: this.sourceName,
      }),
    );
  }

  private parseExpressionStmt(): Option<ExpressionStmt> {
    return this.parseExpression()
      .map((expr) => new ExpressionStmt(expr));
  }

  private parseExpression(): Option<Expression> {
    return (this.parseCallExpr() as Option<Expression>)
      .orElse(() => this.parseIdentifierExpr())
      .orElse(() => this.parseIntegerExpr());
  }

  private parseIdentifierExpr(): Option<IdentifierExpr> {
    const tok = this.current;
    if (tok.kind === TokenKind.Ident) {
      this.advance();
      return some(new IdentifierExpr(tok.text, tok.pos));
    }
    return none();
  }

  private parseIntegerExpr(): Option<IntegerExpr> {
    const tok = this.current;
    if (tok.kind === TokenKind.Integer) {
      this.advance();
      return some(new IntegerExpr(parseInt(tok.text, 10), tok.pos));
    }
    return none();
  }

  private parseCallExpr(): Option<CallExpr> {
    const maybeCallee = this.parseExpression();
    if (maybeCallee.isNone()) return none();
    const callee = maybeCallee.unwrap();

    if (this.peekToken(TokenKind.LParen).isNone()) return none();
    this.advance();

    const arg = this.parseExpression()
      .unwrapOrElseThrow(() => this.tokenError("Expression"));

    this.parseToken(TokenKind.RParen, true);

    const offset = callee.pos.offset;
    const length = this.tokens.getOffset() - offset;
    return some(
      new CallExpr(callee, [arg], {
        offset,
        length,
        sourceName: this.sourceName,
      }),
    );
  }
}
