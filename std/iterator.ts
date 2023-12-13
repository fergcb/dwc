// deno-lint-ignore-file no-explicit-any
import { none, type Option, some } from "./option.ts";

interface EcmaIterator<T> {
  next(): IteratorResult<T>;
}

function isEcmaIterator(value: any): value is EcmaIterator<any> {
  return typeof value["next"] === "function";
}

type IntoIterator<T> = Iterator<T> | Iterable<T> | EcmaIterator<T>;

export abstract class Iterator<T> {
  protected done = false;
  protected _current: Option<T> = none();

  protected abstract _next(): Option<T>;

  public next(): Option<T> {
    if (this.isDone()) return none();
    this._current = this._next();
    if (this._current.isNone()) this.done = true;
    return this._current;
  }

  public current(): Option<T> {
    return this._current;
  }

  public isDone(): boolean {
    return this.done;
  }

  static from<U>(source: IntoIterator<U>): Iterator<U> {
    if (source instanceof Iterator) return source;
    if (isEcmaIterator(source)) return new EcmaIteratorIterator(source);
    if (typeof source[Symbol.iterator] === "function") {
      return new EcmaIteratorIterator(source[Symbol.iterator]());
    }
    throw new Error("Failed to coerce value into an Iterator");
  }

  static over<U>(array: Array<U>): ArrayIterator<U> {
    return new ArrayIterator<U>(array);
  }

  public peekable(): PeekableIterator<T> {
    return new PeekableIterator(this);
  }

  public map<U>(fn: (item: T) => U): MapIterator<T, U> {
    return new MapIterator(this, fn);
  }

  public flatMap<U>(fn: (item: T) => IntoIterator<U>): FlatMapIterator<T, U> {
    return new FlatMapIterator(this, fn);
  }

  public filter(fn: (item: T) => boolean): FilterIterator<T> {
    return new FilterIterator(this, fn);
  }

  public forEach(fn: (item: T) => void): void {
    for (const item of this) fn(item);
  }

  public take(n: number): TakeIterator<T> {
    return new TakeIterator(this, n);
  }

  public takeWhile(fn: (item: T) => boolean): TakeWhileIterator<T> {
    return new TakeWhileIterator(this, fn);
  }

  public zip<U extends any[]>(
    ...iters: Iterators<U>
  ): ZipIterator<Prepend<T, U>> {
    return new ZipIterator<Prepend<T, U>>([this, ...iters] as any);
  }

  public [Symbol.iterator]() {
    return {
      next: () => {
        return {
          value: this.next().unwrapUnchecked(),
          done: this.isDone(),
        } satisfies IteratorResult<T>;
      },
    };
  }
}

export class ArrayIterator<T> extends Iterator<T> {
  private pointer: number;

  constructor(private readonly items: Array<T>) {
    super();
    this.pointer = 0;
  }

  public _next(): Option<T> {
    if (this.pointer >= this.items.length) return none();
    return some(this.items[this.pointer++]);
  }
}

export class EcmaIteratorIterator<T> extends Iterator<T> {
  constructor(private readonly iterator: EcmaIterator<T>) {
    super();
  }

  public _next(): Option<T> {
    const res = this.iterator.next();
    if (res.done ?? false) return none();
    return some(res.value);
  }
}

export abstract class Peekable<T> extends Iterator<T> {
  private readonly peeked: T[] = [];

  protected abstract _next(): Option<T>;

  public next(): Option<T> {
    if (this.isDone()) return none();
    let next;
    if (this.peeked.length > 0) next = some(this.peeked.shift()!);
    else next = this._next();
    this._current = next;
    if (next.isNone()) this.done = true;
    return next;
  }

  public peek(): Option<T> {
    if (this.peeked.length > 0) return some(this.peeked[0]);
    const val = this._next();
    if (val.isSome()) this.peeked.push(val.unwrap());
    return val;
  }
}

export class PeekableIterator<T> extends Peekable<T> {
  constructor(private readonly input: Iterator<T>) {
    super();
  }

  public _next(): Option<T> {
    return this.input.next();
  }
}

export class MapIterator<T, U> extends Iterator<U> {
  constructor(
    private readonly input: Iterator<T>,
    private readonly fn: (item: T) => U
  ) {
    super();
  }

  public _next(): Option<U> {
    return this.input.next().map(this.fn);
  }
}

export class FlatMapIterator<T, U> extends Iterator<U> {
  private currentIter: Option<Iterator<U>>;

  constructor(
    private readonly input: Iterator<T>,
    private readonly fn: (item: T) => IntoIterator<U>
  ) {
    super();
    this.currentIter = none();
  }

  public _next(): Option<U> {
    do {
      if (this.currentIter.isSome()) {
        const maybeNext = this.currentIter.unwrap().next();
        if (maybeNext.isSome()) return maybeNext;
      }

      this.currentIter = this.input.next().map(this.fn).map(Iterator.from);
    } while (this.currentIter.isSome());

    return none();
  }
}

export class FilterIterator<T> extends Iterator<T> {
  private started = false;
  private last: Option<T> = none();

  constructor(
    private readonly input: Iterator<T>,
    private readonly predicate: (item: T) => boolean
  ) {
    super();
  }

  public _next(): Option<T> {
    if (this.started && this.last.isNone()) return none();
    this.started = true;
    let item;
    do {
      item = this.input.next();
    } while (item.isSome() && !this.predicate(item.unwrap()));
    this.last = item;
    return item;
  }
}

export class TakeIterator<T> extends Iterator<T> {
  private counter: number;

  constructor(
    private readonly input: Iterator<T>,
    private readonly count: number
  ) {
    super();
    this.counter = 0;
  }

  public _next(): Option<T> {
    if (this.counter >= this.count) return none();
    this.counter += 1;
    return this.input.next();
  }
}

export class TakeWhileIterator<T> extends Iterator<T> {
  constructor(
    private readonly input: Iterator<T>,
    private readonly predicate: (item: T) => boolean
  ) {
    super();
  }

  public _next(): Option<T> {
    const item = this.input.next();
    if (!item.map(this.predicate).unwrapOr(false)) return none();
    return item;
  }
}

type Iterators<T extends any[]> = {
  [I in keyof T]: Iterator<T[I]>;
} & { length: T["length"] };

type Prepend<T, U extends any[]> = ((_t: T, ..._u: U) => unknown) extends (
  ..._: infer Result
) => unknown
  ? Result
  : never;

export class ZipIterator<T extends any[]> extends Iterator<T> {
  constructor(private readonly iters: Iterators<T>) {
    super();
  }

  public _next(): Option<T> {
    const items: any[] = [];

    for (const iter of this.iters) {
      const item = iter.next();
      if (item.isNone()) return none();
      items.push(item.unwrap());
    }

    return some(items) as Option<T>;
  }
}

export class Range extends Iterator<number> {
  constructor(
    private readonly from: number,
    private readonly to?: number,
    private readonly inc: number = 1
  ) {
    super();
    if (this.to === undefined) {
      this.to = this.from;
      this.from = 0;
    }
    this._current = some(this.from);
  }

  public _next(): Option<number> {
    if (this.checkDone()) return none();
    const item = this._current;
    this._current = this._current.map((c) => (c += this.inc));
    return item;
  }

  private checkDone(): boolean {
    return (
      (this.inc > 0 &&
        this._current.map((c) => c >= this.to!).unwrapOr(false)) ||
      (this.inc < 0 && this._current.map((c) => c <= this.to!).unwrapOr(false))
    );
  }
}
