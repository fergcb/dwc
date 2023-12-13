import { createToken, Lexer, type TokenType } from "chevrotain";

const tokenConfigs = [
  {
    name: "WhiteSpace",
    pattern: /\s+/,
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
  // Combinators
  { name: "Pipe", pattern: /\|>/ },
  { name: "AwaitPipe", pattern: /\|\|>/ },
  // Comparison
  { name: "Equals", pattern: /==/ },
  { name: "NotEquals", pattern: /!=/ },
  { name: "LtEqual", pattern: /<=/ },
  { name: "GtEqual", pattern: />=/ },
  { name: "LessThan", pattern: /</ },
  { name: "GreaterThan", pattern: />/ },
  // Arithmetic
  { name: "Star", pattern: /\*/ },
  { name: "Slash", pattern: /\// },
  { name: "Percent", pattern: /%/ },
  { name: "Caret", pattern: /\^/ },
  // Boolean
  { name: "And", pattern: /&/ },
  { name: "Pipe", pattern: /\|/ },
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
] as const;

export type TokenKind = {
  [K in (typeof tokenConfigs)[number]["name"]]: TokenType;
};

export const Token = Object.fromEntries(
  tokenConfigs.map((config) => [config.name, createToken(config)]),
) as TokenKind;

export const tokens = Object.values(Token);

export const lexer = new Lexer(tokens);
