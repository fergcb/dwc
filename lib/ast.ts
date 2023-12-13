import { Position } from "$lib/position.ts";
import * as JS from "npm:@types/estree";

export abstract class AstNode {
  constructor(public readonly pos: Position) {}

  public abstract transpile(): JS.Node;
}

export abstract class Expression extends AstNode {
  public abstract transpile(): JS.Expression;
}

export class IdentifierExpr extends Expression {
  constructor(public readonly ident: string, pos: Position) {
    super(pos);
  }

  public transpile(): JS.Identifier {
    return {
      type: "Identifier",
      name: this.ident,
    };
  }
}

export class IntegerExpr extends Expression {
  constructor(public readonly int: number, pos: Position) {
    super(pos);
  }

  public transpile(): JS.Literal {
    return {
      type: "Literal",
      value: this.int,
    };
  }
}

export class CallExpr extends Expression {
  constructor(
    public readonly callee: Expression,
    public readonly args: Expression[],
    pos: Position,
  ) {
    super(pos);
  }

  public transpile(): JS.CallExpression {
    return {
      type: "CallExpression",
      callee: this.callee.transpile(),
      arguments: this.args.map((arg) => arg.transpile()),
      optional: false,
    };
  }
}

export class MemberExpr extends Expression {
  constructor(
    public readonly object: Expression,
    public readonly member: IdentifierExpr,
    pos: Position,
  ) {
    super(pos);
  }

  public transpile(): JS.MemberExpression {
    return {
      type: "MemberExpression",
      object: this.object.transpile(),
      property: this.member.transpile(),
      computed: false,
      optional: false,
    };
  }
}

export class NamespaceMemberExpr extends Expression {
  constructor(
    public readonly namespace: Expression,
    public readonly member: IdentifierExpr,
    pos: Position,
  ) {
    super(pos);
  }

  public transpile(): JS.MemberExpression {
    return {
      type: "MemberExpression",
      object: this.namespace.transpile(),
      property: this.member.transpile(),
      computed: false,
      optional: false,
    };
  }
}

export abstract class Statement extends AstNode {
  public abstract transpile(): JS.Statement;
}

export class ExpressionStmt extends Statement {
  constructor(private readonly expr: Expression) {
    super(expr.pos);
  }

  public transpile(): JS.ExpressionStatement {
    return {
      type: "ExpressionStatement",
      expression: this.expr.transpile(),
    };
  }
}

export class VariableDeclarationStmt extends Statement {
  constructor(
    private readonly ident: string,
    private readonly value: Expression,
    private readonly mutable: boolean,
    pos: Position,
  ) {
    super(pos);
  }

  public transpile(): JS.VariableDeclaration {
    return {
      type: "VariableDeclaration",
      kind: this.mutable ? "let" : "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: this.ident },
          init: this.value.transpile(),
        },
      ],
    };
  }
}

export class Program extends AstNode {
  constructor(
    private readonly stmts: Statement[],
    pos: Position,
  ) {
    super(pos);
  }

  public transpile(): JS.Program {
    return {
      type: "Program",
      body: this.stmts.map((stmt) => stmt.transpile()),
      sourceType: "module",
    };
  }
}
