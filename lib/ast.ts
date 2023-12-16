import { mergePos, Position } from "$lib/position.ts";
import * as JS from "npm:@types/estree@1.0.5";

export abstract class AstNode {
  constructor(public readonly pos: Position) {}

  public abstract transpile(): JS.Node;
}

export abstract class Expression extends AstNode {
  public abstract transpile(): JS.Expression;
}

const BINARY_OPERATORS = [
  // Combinators
  "|>",
  "||>",
  // Logic
  "&&",
  "||",
  // Equality
  "==",
  "!=",
  "is",
  // Comparison
  "<=",
  ">=",
  "<",
  ">",
  // Arithmetic
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  // Bitwise
  "&",
  "|",
] as const;

export type BinOp = (typeof BINARY_OPERATORS)[number];

function precedence(op: BinOp): number {
  return BINARY_OPERATORS.indexOf(op);
}

type BinOpTreeNode = Expression | {
  lhs: BinOpTreeNode;
  op: BinOp;
  rhs: BinOpTreeNode;
};

export class BinaryExpression extends AstNode {
  constructor(
    private readonly lhs: Expression,
    private readonly op: BinOp,
    private readonly rhs: Expression,
    pos: Position,
  ) {
    super(pos);
  }

  public static from(
    head: Expression,
    ops: Array<readonly [BinOp, Expression]>,
  ): Expression {
    if (ops.length === 0) return head;
    let root: BinOpTreeNode = head;

    for (const [op, rhs] of ops) {
      root = this.insertOp(root, op, rhs);
    }

    return this.buildTree(root);
  }

  public static insertOp(
    root: BinOpTreeNode,
    op: BinOp,
    rhs: Expression,
  ): BinOpTreeNode {
    if (root instanceof Expression || precedence(op) <= precedence(root.op)) {
      return { lhs: root, op, rhs };
    }

    root.rhs = this.insertOp(root.rhs, op, rhs);
    return root;
  }

  private static buildTree(node: BinOpTreeNode): Expression {
    if (node instanceof Expression) return node;
    const lhs = this.buildTree(node.lhs);
    const rhs = this.buildTree(node.rhs);
    const pos = mergePos(lhs.pos, rhs.pos);
    if (node.op === "|>") return new CallExpr(rhs, [lhs], pos);
    if (node.op === "||>") {
      return new AwaitExpr(new CallExpr(rhs, [lhs], pos), pos);
    }
    return new BinaryExpression(lhs, node.op, rhs, pos);
  }

  private getJSOperator(): JS.BinaryOperator {
    switch (this.op) {
      case "==":
        return "===";
      case "!=":
        return "!==";
      case "<=":
        return "<=";
      case ">=":
        return ">=";
      case "<":
        return "<";
      case ">":
        return ">";
      case "*":
        return "*";
      case "/":
        return "/";
      case "%":
        return "%";
      case "^":
        return "**";
      case "&":
        return "&";
      case "|":
        return "|";
    }
    throw new Error(
      `The DW binary operator '${this.op}' does not have a corresponding JS operator, and should be handled separately.`,
    );
  }

  public transpile(): JS.Expression {
    if (this.op === "&&" || this.op === "||") {
      return {
        type: "LogicalExpression",
        operator: this.op,
        left: this.lhs.transpile(),
        right: this.rhs.transpile(),
      };
    }
    if (this.op === "is") {
      return {
        type: "CallExpression",
        optional: false,
        callee: {
          type: "MemberExpression",
          computed: false,
          optional: false,
          object: { type: "Identifier", name: "$DW" },
          property: { type: "Identifier", name: "is" },
        },
        arguments: [
          this.lhs.transpile(),
          this.rhs.transpile(),
        ],
      };
    }

    return {
      type: "BinaryExpression",
      operator: this.getJSOperator(),
      left: this.lhs.transpile(),
      right: this.rhs.transpile(),
    };
  }
}

export class AwaitExpr extends Expression {
  constructor(public readonly expr: Expression, pos: Position) {
    super(pos);
  }

  public transpile(): JS.AwaitExpression {
    return {
      type: "AwaitExpression",
      argument: this.expr.transpile(),
    };
  }
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
