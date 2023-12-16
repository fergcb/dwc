import { createToken, Lexer, type TokenType } from "chevrotain";

const tokenConfigs = [
  {
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED,
  },
  {
    name: "SingleLineComment",
    pattern: /\/\/[^\n\r]*/,
    group: Lexer.SKIPPED,
  },
  {
    name: "MultilineComment",
    pattern: /\/\*[^*]*\*+([^/*][^*]*\*+})*\//,
    line_breaks: true,
    group: Lexer.SKIPPED,
  },
  // Keywords
  { name: "Let", pattern: /let/ },
  { name: "Mut", pattern: /mut/ },
  { name: "Lazy", pattern: /lazy/ },
  // Operators
  // Property Access
  { name: "Dot", pattern: /\./ },
  { name: "DoubleColon", pattern: /::/ },
  // Binary Operators
  {
    name: "BinaryOperator",
    pattern: Lexer.NA,
    children: [
      // Combinators
      { name: "PipeArrow", pattern: /\|>/ },
      { name: "AwaitPipeArrow", pattern: /\|\|>/ },
      // Logical
      { name: "DoubleAnd", pattern: /&&/ },
      { name: "DoublePipe", pattern: /\|\|/ },
      // Equality
      { name: "Equals", pattern: /==/ },
      { name: "NotEquals", pattern: /!=/ },
      { name: "Is", pattern: /is/ },
      // Comparison
      { name: "LtEqual", pattern: /<=/ },
      { name: "GtEqual", pattern: />=/ },
      { name: "LessThan", pattern: /</ },
      { name: "GreaterThan", pattern: />/ },
      // Arithmetic
      { name: "Plus", pattern: /\+/ },
      { name: "Minus", pattern: /-/ },
      { name: "Star", pattern: /\*/ },
      { name: "Slash", pattern: /\// },
      { name: "Percent", pattern: /%/ },
      { name: "Caret", pattern: /\^/ },
      // Bitwise
      { name: "And", pattern: /&/ },
      { name: "Pipe", pattern: /\|/ },
    ],
  },

  { name: "Not", pattern: /!/ },
  { name: "BitwiseNot", pattern: /~/ },
  // Misc. Symbols
  { name: "Assign", pattern: /=/ },
  { name: "Colon", pattern: /:/ },
  { name: "Semicolon", pattern: /;/ },
  { name: "Comma", pattern: /,/ },
  { name: "LParen", pattern: /\(/ },
  { name: "RParen", pattern: /\)/ },
  { name: "LBracket", pattern: /\[/ },
  { name: "RBracket", pattern: /\]/ },
  { name: "LBrace", pattern: /\{/ },
  { name: "RBrace", pattern: /\}/ },
  // Values
  { name: "Integer", pattern: /0|[1-9][0-9]*/ },
  {
    name: "Identifier",
    pattern: /[a-zA-Z_][a-zA-Z_0-9]*/,
  },
];

export type TokenKind = {
  [K in (typeof tokenConfigs)[number]["name"]]: TokenType;
};

export const Token = Object.fromEntries(
  tokenConfigs.flatMap((config) => {
    const tok = [config.name, createToken(config)] as const;
    const children = config.children?.map((child) => [
      child.name,
      createToken({ ...child, categories: [tok[1]] }),
    ]) ?? [];
    return [tok, ...children];
  }),
) as TokenKind;

export const tokens = Object.values(Token);

export const binaryOperators = tokens.filter((tok) =>
  tok.CATEGORIES?.includes(Token.BinaryOperator)
);

export const lexer = new Lexer(tokens);
