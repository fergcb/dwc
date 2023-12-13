import { CstParser, IOrAlt } from "chevrotain";
import { lexer, Token, tokens } from "$lib/lexer.ts";

class DwParser extends CstParser {
  private cMemberExpression?: IOrAlt<unknown>[];
  private cPrimaryExpression?: IOrAlt<unknown>[];

  constructor() {
    super(tokens);
    this.performSelfAnalysis();
  }

  public Program = this.RULE("Program", () => {
    this.AT_LEAST_ONE(() => this.SUBRULE(this.Statement));
  });

  private Statement = this.RULE("Statement", () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.LetAssignmentStmt) },
      { ALT: () => this.SUBRULE(this.ExpressionStmt) },
    ]);
    this.CONSUME(Token.Semicolon);
  });

  private LetAssignmentStmt = this.RULE("LetAssignmentStmt", () => {
    this.CONSUME(Token.Let);
    this.OPTION(() => this.CONSUME(Token.Mut));
    this.CONSUME(Token.Identifier);
    this.CONSUME(Token.Assign);
    this.SUBRULE(this.Expression);
  });

  private ExpressionStmt = this.RULE("ExpressionStmt", () => {
    this.SUBRULE(this.Expression);
  });

  private Expression = this.RULE("Expression", () => {
    this.SUBRULE(this.CallExpression);
  });

  private CallExpression = this.RULE("CallExpression", () => {
    this.SUBRULE(this.MemberExpression);
    this.OPTION(() => {
      this.SUBRULE2(this.Arguments);
    });
  });

  private Arguments = this.RULE("Arguments", () => {
    this.CONSUME(Token.LParen);
    this.OPTION(() => {
      this.SUBRULE(this.Expression);
      this.MANY(() => {
        this.CONSUME(Token.Comma);
        this.SUBRULE2(this.Expression);
      });
    });
    this.CONSUME(Token.RParen);
  });

  private MemberExpression = this.RULE("MemberExpression", () => {
    this.SUBRULE(this.PrimaryExpression);
    this.OPTION(() => {
      this.OR(
        this.cMemberExpression || (this.cMemberExpression = [
          { ALT: () => this.SUBRULE2(this.DotMember) },
          { ALT: () => this.SUBRULE2(this.DoubleColonMember) },
        ]),
      );
    });
  });

  private DotMember = this.RULE("DotMember", () => {
    this.CONSUME(Token.Dot);
    this.SUBRULE(this.IdentifierExpr);
  });

  private DoubleColonMember = this.RULE("DoubleColonMember", () => {
    this.CONSUME(Token.DoubleColon);
    this.SUBRULE(this.IdentifierExpr);
  });

  private PrimaryExpression = this.RULE("PrimaryExpression", () => {
    this.OR(
      this.cPrimaryExpression || (this.cPrimaryExpression = [
        { ALT: () => this.SUBRULE(this.IdentifierExpr) },
        { ALT: () => this.SUBRULE(this.IntegerLiteralExpr) },
      ]),
    );
  });

  private IdentifierExpr = this.RULE("IdentifierExpr", () => {
    this.CONSUME(Token.Identifier);
  });

  private IntegerLiteralExpr = this.RULE("IntegerLiteralExpr", () => {
    this.CONSUME(Token.Integer);
  });
}

export const parser = new DwParser();

export const productions = parser.getGAstProductions();

export function parse(source: string) {
  const lexResult = lexer.tokenize(source);
  parser.input = lexResult.tokens;
  const cst = parser.Program();

  return {
    cst,
    lexErrors: lexResult.errors,
    parseErrors: parser.errors,
  };
}
