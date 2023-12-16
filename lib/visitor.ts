import { parser } from "$lib/parser.ts";
import {
  ArgumentsCstChildren,
  BinaryExpressionCstChildren,
  CallExpressionCstChildren,
  DotMemberCstChildren,
  DoubleColonMemberCstChildren,
  ExpressionCstChildren,
  ExpressionStmtCstChildren,
  ICstNodeVisitor,
  IdentifierExprCstChildren,
  IntegerLiteralExprCstChildren,
  LetAssignmentStmtCstChildren,
  MemberExpressionCstChildren,
  PrimaryExpressionCstChildren,
  ProgramCstChildren,
  StatementCstChildren,
} from "$lib/cst.d.ts";
import * as ast from "$lib/ast.ts";
import { cstNodePos, extendPosTo, mergePos, tokenPos } from "$lib/position.ts";

type VisitorContext = {
  sourceName: string;
};

const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

class DwCstVisitor extends BaseCstVisitor
  implements ICstNodeVisitor<VisitorContext, ast.AstNode | ast.AstNode[]> {
  constructor() {
    super();
    this.validateVisitor();
  }

  public Program(node: ProgramCstChildren, ctx: VisitorContext): ast.Program {
    const stmts = node.Statement.map((stmt) => this.visit(stmt, ctx)) ?? [];

    const pos = mergePos(
      ...node.Statement.map((stmt) => cstNodePos(stmt, ctx.sourceName)),
    );

    return new ast.Program(stmts, pos);
  }

  public Statement(
    node: StatementCstChildren,
    ctx: VisitorContext,
  ): ast.Statement {
    if (node.LetAssignmentStmt) return this.visit(node.LetAssignmentStmt, ctx);
    if (node.ExpressionStmt) return this.visit(node.ExpressionStmt, ctx);
    throw new Error("Invalid CST Statement Node.");
  }

  public LetAssignmentStmt(
    node: LetAssignmentStmtCstChildren,
    ctx: VisitorContext,
  ): ast.VariableDeclarationStmt {
    return new ast.VariableDeclarationStmt(
      node.Identifier[0].image,
      this.visit(node.Expression, ctx),
      node.Mut !== undefined,
      mergePos(
        tokenPos(node.Let[0], ctx.sourceName),
        cstNodePos(node.Expression[0], ctx.sourceName),
      ),
    );
  }

  public ExpressionStmt(
    node: ExpressionStmtCstChildren,
    ctx: VisitorContext,
  ): ast.ExpressionStmt {
    const expr = this.visit(node.Expression, ctx);
    return new ast.ExpressionStmt(expr);
  }

  public Expression(
    node: ExpressionCstChildren,
    ctx: VisitorContext,
  ): ast.Expression {
    return this.visit(node.BinaryExpression, ctx);
  }

  public BinaryExpression(
    node: BinaryExpressionCstChildren,
    ctx: VisitorContext,
  ): ast.Expression {
    const head = this.visit(node.CallExpression[0], ctx);
    if (node.BinaryOperator) {
      const ops = node.BinaryOperator.map((op, i) =>
        [
          op.image as ast.BinOp,
          this.visit(node.CallExpression[i + 1], ctx) as ast.Expression,
        ] as const
      );
      return ast.BinaryExpression.from(head, ops);
    }

    return head;
  }

  public CallExpression(
    node: CallExpressionCstChildren,
    ctx: VisitorContext,
  ): ast.Expression {
    const expr = this.visit(node.MemberExpression, ctx);
    if (node.Arguments) {
      return new ast.CallExpr(
        expr,
        this.visit(node.Arguments, ctx),
        extendPosTo(
          expr.pos,
          node.Arguments.map((arg) => arg.location?.endOffset).at(-1),
        ),
      );
    }
    return expr;
  }

  public Arguments(
    node: ArgumentsCstChildren,
    ctx: VisitorContext,
  ): ast.Expression[] {
    return node.Expression?.map((expr) => this.visit(expr, ctx)) ?? [];
  }

  public MemberExpression(
    node: MemberExpressionCstChildren,
    ctx: VisitorContext,
  ): ast.Expression {
    const expr = this.visit(node.PrimaryExpression, ctx);

    if (node.DotMember) {
      const ident = this.visit(node.DotMember, ctx);
      return new ast.MemberExpr(expr, ident, mergePos(expr.pos, ident.pos));
    }

    if (node.DoubleColonMember) {
      const ident = this.visit(node.DoubleColonMember, ctx);
      return new ast.NamespaceMemberExpr(
        expr,
        ident,
        mergePos(expr.pos, ident.pos),
      );
    }

    return expr;
  }

  public DotMember(
    node: DotMemberCstChildren,
    ctx: VisitorContext,
  ): ast.IdentifierExpr {
    return this.visit(node.IdentifierExpr, ctx);
  }

  public DoubleColonMember(
    node: DoubleColonMemberCstChildren,
    ctx: VisitorContext,
  ): ast.IdentifierExpr {
    return this.visit(node.IdentifierExpr, ctx);
  }

  public PrimaryExpression(
    node: PrimaryExpressionCstChildren,
    ctx: VisitorContext,
  ): ast.Expression {
    if (node.IdentifierExpr) return this.visit(node.IdentifierExpr, ctx);
    if (node.IntegerLiteralExpr) {
      return this.visit(node.IntegerLiteralExpr, ctx);
    }
    throw new Error("Invalid CST PrimaryExpression Node.");
  }

  public IdentifierExpr(
    node: IdentifierExprCstChildren,
    ctx: VisitorContext,
  ): ast.IdentifierExpr {
    const ident = node.Identifier[0];
    return new ast.IdentifierExpr(ident.image, tokenPos(ident, ctx.sourceName));
  }

  public IntegerLiteralExpr(
    node: IntegerLiteralExprCstChildren,
    ctx: VisitorContext,
  ): ast.IntegerExpr {
    const int = node.Integer[0];
    return new ast.IntegerExpr(
      parseInt(int.image, 10),
      tokenPos(int, ctx.sourceName),
    );
  }
}

export const visitor = new DwCstVisitor();
