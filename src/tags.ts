export enum NbtType {
  END = 0,
  BYTE = 1,
  SHORT = 2,
  INT = 3,
  LONG = 4,
  FLOAT = 5,
  DOUBLE = 6,
  BYTE_ARRAY = 7,
  STRING = 8,
  LIST = 9,
  COMPOUND = 10,
  INT_ARRAY = 11,
  LONG_ARRAY = 12,
  ANY_NUMERIC = 99,
}

const quoteAndEscape = (string: string): string => {
  let builder = "";
  let quote: string = undefined;
  for (let i = 0; i < string.length; ++i) {
    let c = string.charAt(i);
    if (c == "\\") {
      builder += "\\";
    } else if (c == '"' || c == "'") {
      if (!quote) {
        quote = c == '"' ? "'" : '"';
      }
      if (quote == c) {
        builder += "\\";
      }
    }
    builder += c;
  }
  if (!quote) {
    quote = '"';
  }
  return quote + builder + quote;
};

const SIMPLE_VALUE_REGEX = /^[A-Za-z0-9._+-]+$/;
const handleEscape = (string: string): string => {
  const simple = SIMPLE_VALUE_REGEX.test(string);
  return simple ? string : quoteAndEscape(string);
};

export abstract class Tag<T> {
  private type: NbtType;
  private value: T;

  constructor(type: NbtType, value: T) {
    this.type = type;
    this.value = value;
  }

  public abstract asString(indent?: number): string;

  public getValue(): T {
    return this.value;
  }

  public getType(): NbtType {
    return this.type;
  }

  public isType(type: NbtType): boolean {
    return this.type == type;
  }
}
export abstract class NumberTag<T> extends Tag<T> {
  public getNumber(): number {
    return Number(this.getValue());
  }

  public isType(type: NbtType): boolean {
    return type == NbtType.ANY_NUMERIC || super.isType(type);
  }
}
export abstract class ArrayTag<T> extends Tag<T[]> {}

export class EndTag extends Tag<undefined> {
  constructor() {
    super(NbtType.END, undefined);
  }
  asString(indent?: number): string {
    return "END";
  }
}
export class ByteTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.BYTE, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}b`;
  }
}
export class ShortTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.SHORT, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}s`;
  }
}
export class IntTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.INT, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}`;
  }
}
export class LongTag extends NumberTag<bigint> {
  constructor(value: bigint) {
    super(NbtType.LONG, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}L`;
  }
}
export class FloatTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.FLOAT, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}f`;
  }
}
export class DoubleTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.DOUBLE, value);
  }
  asString(indent?: number): string {
    return `${this.getValue()}d`;
  }
}
export class ByteArrayTag extends ArrayTag<number> {
  constructor(value: number[]) {
    super(NbtType.BYTE_ARRAY, value);
  }
  asString(indent?: number): string {
    const value = this.getValue();
    let builder = "[B;";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) builder += ",";
      builder += value[i] + "B";
    }
    return builder + "]";
  }
}
export class StringTag extends Tag<string> {
  constructor(value: string) {
    super(NbtType.STRING, value);
  }
  asString(indent?: number): string {
    return quoteAndEscape(this.getValue());
  }
}
export class ListTag<T extends Tag<any>> extends ArrayTag<T> {
  private listType: NbtType;
  constructor(type: NbtType, value: T[]) {
    super(NbtType.LIST, value);
    this.listType = type;
  }
  asString(indent?: number): string {
    const value = this.getValue();
    let builder = "[";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) builder += ",";
      builder += value[i].asString(indent);
    }
    return builder + "]";
  }
  public getListType(): NbtType {
    return this.listType;
  }
}
export class CompoundTag extends Tag<Map<string, Tag<any>>> {
  constructor(value: Map<string, Tag<any>>) {
    super(NbtType.COMPOUND, value);
  }
  asString(indent?: number): string {
    const value = this.getValue();
    const keys = value.keys().toArray().sort();
    let builder = "{";
    for (let i = 0; i < keys.length; i++) {
      if (i != 0) builder += ",";
      const key = keys[i];
      const tag = value.get(key);
      builder += handleEscape(key) + ":" + tag.asString(indent);
    }
    return builder + "}";
  }
}
export class IntArrayTag extends ArrayTag<number> {
  constructor(value: number[]) {
    super(NbtType.INT_ARRAY, value);
  }
  asString(indent?: number): string {
    const value = this.getValue();
    let builder = "[I;";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) builder += ",";
      builder += value[i];
    }
    return builder + "]";
  }
}
export class LongArrayTag extends ArrayTag<bigint> {
  constructor(value: bigint[]) {
    super(NbtType.LONG_ARRAY, value);
  }
  asString(indent?: number): string {
    const value = this.getValue();
    let builder = "[L;";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) builder += ",";
      builder += value[i] + "L";
    }
    return builder + "]";
  }
}
