import type { CstNode, ICstVisitor, IToken } from "chevrotain";

export interface ProgramCstNode extends CstNode {
  name: "Program";
  children: ProgramCstChildren;
}

export type ProgramCstChildren = {
  Statement: StatementCstNode[];
};

export interface StatementCstNode extends CstNode {
  name: "Statement";
  children: StatementCstChildren;
}

export type StatementCstChildren = {
  LetAssignmentStmt?: LetAssignmentStmtCstNode[];
  ExpressionStmt?: ExpressionStmtCstNode[];
  Semicolon: IToken[];
};

export interface LetAssignmentStmtCstNode extends CstNode {
  name: "LetAssignmentStmt";
  children: LetAssignmentStmtCstChildren;
}

export type LetAssignmentStmtCstChildren = {
  Let: IToken[];
  Mut?: IToken[];
  Identifier: IToken[];
  Assign: IToken[];
  Expression: ExpressionCstNode[];
};

export interface ExpressionStmtCstNode extends CstNode {
  name: "ExpressionStmt";
  children: ExpressionStmtCstChildren;
}

export type ExpressionStmtCstChildren = {
  Expression: ExpressionCstNode[];
};

export interface ExpressionCstNode extends CstNode {
  name: "Expression";
  children: ExpressionCstChildren;
}

export type ExpressionCstChildren = {
  CallExpression: CallExpressionCstNode[];
};

export interface CallExpressionCstNode extends CstNode {
  name: "CallExpression";
  children: CallExpressionCstChildren;
}

export type CallExpressionCstChildren = {
  MemberExpression: MemberExpressionCstNode[];
  Arguments?: ArgumentsCstNode[];
};

export interface ArgumentsCstNode extends CstNode {
  name: "Arguments";
  children: ArgumentsCstChildren;
}

export type ArgumentsCstChildren = {
  LParen: IToken[];
  Expression?: (ExpressionCstNode)[];
  Comma?: IToken[];
  RParen: IToken[];
};

export interface MemberExpressionCstNode extends CstNode {
  name: "MemberExpression";
  children: MemberExpressionCstChildren;
}

export type MemberExpressionCstChildren = {
  PrimaryExpression: PrimaryExpressionCstNode[];
  DotMember?: DotMemberCstNode[];
  DoubleColonMember?: DoubleColonMemberCstNode[];
};

export interface DotMemberCstNode extends CstNode {
  name: "DotMember";
  children: DotMemberCstChildren;
}

export type DotMemberCstChildren = {
  Dot: IToken[];
  IdentifierExpr: IdentifierExprCstNode[];
};

export interface DoubleColonMemberCstNode extends CstNode {
  name: "DoubleColonMember";
  children: DoubleColonMemberCstChildren;
}

export type DoubleColonMemberCstChildren = {
  DoubleColon: IToken[];
  IdentifierExpr: IdentifierExprCstNode[];
};

export interface PrimaryExpressionCstNode extends CstNode {
  name: "PrimaryExpression";
  children: PrimaryExpressionCstChildren;
}

export type PrimaryExpressionCstChildren = {
  IdentifierExpr?: IdentifierExprCstNode[];
  IntegerLiteralExpr?: IntegerLiteralExprCstNode[];
};

export interface IdentifierExprCstNode extends CstNode {
  name: "IdentifierExpr";
  children: IdentifierExprCstChildren;
}

export type IdentifierExprCstChildren = {
  Identifier: IToken[];
};

export interface IntegerLiteralExprCstNode extends CstNode {
  name: "IntegerLiteralExpr";
  children: IntegerLiteralExprCstChildren;
}

export type IntegerLiteralExprCstChildren = {
  Integer: IToken[];
};

export interface ICstNodeVisitor<IN, OUT> extends ICstVisitor<IN, OUT> {
  Program(children: ProgramCstChildren, param?: IN): OUT;
  Statement(children: StatementCstChildren, param?: IN): OUT;
  LetAssignmentStmt(children: LetAssignmentStmtCstChildren, param?: IN): OUT;
  ExpressionStmt(children: ExpressionStmtCstChildren, param?: IN): OUT;
  Expression(children: ExpressionCstChildren, param?: IN): OUT;
  CallExpression(children: CallExpressionCstChildren, param?: IN): OUT;
  Arguments(children: ArgumentsCstChildren, param?: IN): OUT;
  MemberExpression(children: MemberExpressionCstChildren, param?: IN): OUT;
  DotMember(children: DotMemberCstChildren, param?: IN): OUT;
  DoubleColonMember(children: DoubleColonMemberCstChildren, param?: IN): OUT;
  PrimaryExpression(children: PrimaryExpressionCstChildren, param?: IN): OUT;
  IdentifierExpr(children: IdentifierExprCstChildren, param?: IN): OUT;
  IntegerLiteralExpr(children: IntegerLiteralExprCstChildren, param?: IN): OUT;
}
