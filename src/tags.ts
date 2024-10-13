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

const INDENT_CHAR = " ";
const genIndent = (indent: number, indentLevel: number): string => {
  return indent > 0 ? "\n" + INDENT_CHAR.repeat(indent * indentLevel) : "";
};

export abstract class Tag<T> {
  private type: NbtType;
  private value: T;

  constructor(type: NbtType, value: T) {
    this.type = type;
    this.value = value;
  }

  public asString(indent: number = 0): string {
    return this.asString0(indent, 0);
  }

  abstract asString0(indent: number, indentLevel: number): string;

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
  asString0(indent: number, indentLevel: number): string {
    return "END";
  }
}
export class ByteTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.BYTE, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}b`;
  }
}
export class ShortTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.SHORT, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}s`;
  }
}
export class IntTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.INT, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}`;
  }
}
export class LongTag extends NumberTag<bigint> {
  constructor(value: bigint) {
    super(NbtType.LONG, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}L`;
  }
}
export class FloatTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.FLOAT, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}f`;
  }
}
export class DoubleTag extends NumberTag<number> {
  constructor(value: number) {
    super(NbtType.DOUBLE, value);
  }
  asString0(indent: number, indentLevel: number): string {
    return `${this.getValue()}d`;
  }
}
export class ByteArrayTag extends ArrayTag<number> {
  constructor(value: number[]) {
    super(NbtType.BYTE_ARRAY, value);
  }
  asString0(indent: number, indentLevel: number): string {
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
  asString0(indent: number, indentLevel: number): string {
    return quoteAndEscape(this.getValue());
  }
}
export class ListTag<T extends Tag<any>> extends ArrayTag<T> {
  private listType?: NbtType;
  constructor(type?: NbtType, value: T[] = new Array<T>()) {
    super(NbtType.LIST, value);
    this.listType = type;
  }
  private newlines() {
    const listType = this.getListType();
    return listType === NbtType.COMPOUND || listType === NbtType.LIST || listType === NbtType.BYTE_ARRAY || listType === NbtType.INT_ARRAY || listType === NbtType.LONG_ARRAY;
  }
  asString0(indent: number, indentLevel: number): string {
    indentLevel++;
    const newlines = indent > 0 && this.newlines();
    const value = this.getValue();
    let builder = "[";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) {
        builder += ",";
        if (indent > 0 && !newlines) {
          builder += " ";
        }
      }
      if (newlines) {
        builder += genIndent(indent, indentLevel);
      }
      builder += value[i].asString0(indent, indentLevel);
    }
    indentLevel--;
    if (newlines) {
      builder += genIndent(indent, indentLevel);
    }
    return builder + "]";
  }
  public add(tag: T) {
    this.getValue().push(tag);
  }
  public getListType(): NbtType | undefined {
    if (this.listType !== undefined) {
      return this.listType;
    }
    const list = this.getValue();
    if (list.length > 0) {
      return list[0].getType();
    }
    return undefined;
  }
}
export class CompoundTag extends Tag<Map<string, Tag<any>>> {
  constructor(value: Map<string, Tag<any>> = new Map()) {
    super(NbtType.COMPOUND, value);
  }
  asString0(indent: number, indentLevel: number): string {
    indentLevel++;
    const value = this.getValue();
    const keys = value.keys().toArray().sort();
    let builder = "{";
    for (let i = 0; i < keys.length; i++) {
      if (i != 0) {
        builder += ",";
      }
      if (indent > 0) {
        builder += genIndent(indent, indentLevel);
      }
      const key = keys[i];
      builder += handleEscape(key) + ":";
      if (indent > 0) {
        builder += " ";
      }
      const tag = value.get(key);
      builder += tag.asString0(indent, indentLevel);
    }
    indentLevel--;
    builder += genIndent(indent, indentLevel);
    return builder + "}";
  }
  public set(key: string, tag: Tag<any>) {
    this.getValue().set(key, tag);
  }
}
export class IntArrayTag extends ArrayTag<number> {
  constructor(value: number[]) {
    super(NbtType.INT_ARRAY, value);
  }
  asString0(indent: number, indentLevel: number): string {
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
  asString0(indent: number, indentLevel: number): string {
    const value = this.getValue();
    let builder = "[L;";
    for (let i = 0; i < value.length; i++) {
      if (i != 0) builder += ",";
      builder += value[i] + "L";
    }
    return builder + "]";
  }
}
