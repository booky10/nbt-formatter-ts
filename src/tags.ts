const SIMPLE_VALUE_REGEX = /^[A-Za-z0-9._+-]+$/;

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

export interface Tag<T> {
  asString(indent?: number): string;
  getType(): NbtType;
  getValue(): T;
}
export interface NumberTag<T> extends Tag<T> {
  getNumber(): number;
}
export interface ArrayTag<T> extends Tag<T[]> {}

export class EndTag implements Tag<undefined> {
  constructor() {}

  asString(indent?: number): string {
    return "END";
  }
  getType(): NbtType {
    return NbtType.END;
  }
  getValue(): undefined {
    return undefined;
  }
}
export class ByteTag implements NumberTag<number> {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}b`;
  }
  getType(): NbtType {
    return NbtType.BYTE;
  }
  getValue(): number {
    return this.value;
  }
  getNumber(): number {
    return this.value;
  }
}
export class ShortTag implements NumberTag<number> {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}s`;
  }
  getType(): NbtType {
    return NbtType.SHORT;
  }
  getValue(): number {
    return this.value;
  }
  getNumber(): number {
    return this.value;
  }
}
export class IntTag implements NumberTag<number> {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}`;
  }
  getType(): NbtType {
    return NbtType.INT;
  }
  getValue(): number {
    return this.value;
  }
  getNumber(): number {
    return this.value;
  }
}
export class LongTag implements NumberTag<bigint> {
  private value: bigint;

  constructor(value: bigint) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}L`;
  }
  getType(): NbtType {
    return NbtType.LONG;
  }
  getValue(): bigint {
    return this.value;
  }
  getNumber(): number {
    return Number(this.value);
  }
}
export class FloatTag implements NumberTag<number> {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}f`;
  }
  getType(): NbtType {
    return NbtType.FLOAT;
  }
  getValue(): number {
    return this.value;
  }
  getNumber(): number {
    return this.value;
  }
}
export class DoubleTag implements NumberTag<number> {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  asString(indent?: number): string {
    return `${this.value}d`;
  }
  getType(): NbtType {
    return NbtType.DOUBLE;
  }
  getValue(): number {
    return this.value;
  }
  getNumber(): number {
    return this.value;
  }
}
export class ByteArrayTag implements ArrayTag<number> {
  private value: number[];

  constructor(value: number[]) {
    this.value = value;
  }

  asString(indent?: number): string {
    let builder = "[B;";
    for (let i = 0; i < this.value.length; i++) {
      if (i != 0) builder += ",";
      builder += this.value[i] + "B";
    }
    return builder + "]";
  }
  getType(): NbtType {
    return NbtType.BYTE_ARRAY;
  }
  getValue(): number[] {
    return this.value;
  }
}
export class StringTag implements Tag<string> {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  asString(indent?: number): string {
    return quoteAndEscape(this.value);
  }
  getType(): NbtType {
    return NbtType.STRING;
  }
  getValue(): string {
    return this.value;
  }
}
export class ListTag<T extends Tag<any>> implements ArrayTag<T> {
  private type: NbtType;
  private value: T[];

  constructor(type: NbtType, value: T[]) {
    this.type = type;
    this.value = value;
  }

  asString(indent?: number): string {
    let builder = "[";
    for (let i = 0; i < this.value.length; i++) {
      if (i != 0) builder += ",";
      builder += this.value[i].asString(indent);
    }
    return builder + "]";
  }
  getType(): NbtType {
    return NbtType.LIST;
  }
  getValue(): T[] {
    return this.value;
  }
  public getListType(): NbtType {
    return this.type;
  }
}
export class CompoundTag implements Tag<Map<string, Tag<any>>> {
  private value: Map<string, Tag<any>>;

  constructor(value: Map<string, Tag<any>>) {
    this.value = value;
  }

  private handleEscape(string: string): string {
    const simple = SIMPLE_VALUE_REGEX.test(string);
    return simple ? string : quoteAndEscape(string);
  }

  asString(indent?: number): string {
    const keys = this.value.keys().toArray().sort();
    let builder = "{";
    for (let i = 0; i < keys.length; i++) {
      if (i != 0) builder += ",";
      const key = keys[i];
      const tag = this.value.get(key);
      builder += this.handleEscape(key) + ":" + tag.asString(indent);
    }
    return builder + "}";
  }
  getType(): NbtType {
    return NbtType.COMPOUND;
  }
  getValue(): Map<string, Tag<any>> {
    return this.value;
  }
}
export class IntArrayTag implements ArrayTag<number> {
  private value: number[];

  constructor(value: number[]) {
    this.value = value;
  }

  asString(indent?: number): string {
    let builder = "[I;";
    for (let i = 0; i < this.value.length; i++) {
      if (i != 0) builder += ",";
      builder += this.value[i];
    }
    return builder + "]";
  }
  getType(): NbtType {
    return NbtType.INT_ARRAY;
  }
  getValue(): number[] {
    return this.value;
  }
}
export class LongArrayTag implements ArrayTag<bigint> {
  private value: bigint[];

  constructor(value: bigint[]) {
    this.value = value;
  }

  asString(indent?: number): string {
    let builder = "[L;";
    for (let i = 0; i < this.value.length; i++) {
      if (i != 0) builder += ",";
      builder += this.value[i] + "L";
    }
    return builder + "]";
  }
  getType(): NbtType {
    return NbtType.LONG_ARRAY;
  }
  getValue(): bigint[] {
    return this.value;
  }
}
