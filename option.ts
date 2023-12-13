// deno-lint-ignore no-explicit-any
export abstract class Option<T extends NonNullable<any>> {
  constructor(private readonly value: T | null) {}

  static of<T>(value: T | null): Option<T> {
    if (value === null) return none();
    return some<T>(value);
  }

  isNone(): boolean {
    return this.value === null;
  }

  isSome(): boolean {
    return this.value !== null;
  }

  isSomeAnd(fn: (v: T) => boolean): boolean {
    return this.value !== null && fn(this.value);
  }

  unwrap(): T {
    if (this.isNone()) throw new Error("Can't unwrap None");
    return this.value!;
  }

  filter(fn: (v: T) => boolean): Option<T> {
    if (this.isSomeAnd(fn)) return some(this.value!);
    return none();
  }

  // deno-lint-ignore no-explicit-any
  map<U extends NonNullable<any>>(fn: (v: T) => U): Option<U> {
    if (this.isNone()) return none();
    return some<U>(fn(this.value!));
  }

  flatMap<U>(fn: (v: T) => Option<U>): Option<U> {
    if (this.isNone()) return none();
    return fn(this.value!);
  }

  or(optb: Option<T>): Option<T> {
    if (this.isNone()) return optb;
    return some(this.value!);
  }

  orElse(fn: () => Option<T>): Option<T> {
    if (this.isNone()) return fn();
    return some(this.value!);
  }

  orElseThrow(fn: () => Error): Some<T> {
    if (this.isSome()) return some(this.value!);
    throw fn();
  }

  ifPresent(fn: () => void): Option<T> {
    if (this.isSome()) fn();
    return Option.of(this.value!);
  }

  unwrapOr(b: T): T {
    if (this.isNone()) return b;
    return this.value!;
  }

  unwrapOrElseThrow(fn: () => Error): T {
    if (this.isSome()) return this.value!;
    throw fn();
  }

  unwrapUnchecked(): NonNullable<T> {
    return this.value!;
  }
}

export class Some<T> extends Option<T> {
  constructor(value: T) {
    super(value);
  }
}

// deno-lint-ignore no-explicit-any
export class None extends Option<any> {
  constructor() {
    super(null);
  }
}

export function some<T>(value: T) {
  return new Some<T>(value);
}

export function none() {
  return new None();
}
