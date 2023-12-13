import { CstNode, IToken } from "chevrotain";

export interface Position {
  offset: number;
  length: number;
  sourceName: string;
}

export function stringifyPos(pos: Position): string {
  return `${pos.offset}/${pos.length} (${pos.sourceName})`;
}

export function tokenPos(tok: IToken, sourceName: string): Position {
  return {
    offset: tok.startOffset,
    length: (tok.endOffset ?? tok.startOffset) - tok.startOffset,
    sourceName,
  };
}

export function cstNodePos(node: CstNode, sourceName: string): Position {
  const offset = node.location?.startOffset ?? 0;
  const length = (node.location?.endOffset ?? offset) - offset;
  return { offset, length, sourceName };
}

export function mergePos(...positions: Position[]): Position {
  return positions.reduce((acc, cur) => {
    const offset = Math.min(acc.offset, cur.offset);
    const length = Math.max((cur.offset + cur.length) - offset, acc.length);

    if (acc.sourceName !== cur.sourceName) {
      throw new Error(
        `Cannot merge positions: '${stringifyPos(acc)}' and '${
          stringifyPos(cur)
        }' - conflicting source names.`,
      );
    }

    return {
      offset,
      length,
      sourceName: acc.sourceName,
    };
  });
}

export function extendPosTo(pos: Position, newEnd?: number): Position {
  return {
    offset: pos.offset,
    length: newEnd ? Math.max(pos.length, newEnd - pos.offset) : pos.length,
    sourceName: pos.sourceName,
  };
}
