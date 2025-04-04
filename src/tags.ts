import {escapeControlCharacters} from "./SnbtGrammer.js";
import {IGNORE_CASE_COMPARATOR} from "./common/util.js";
import ParseState from "./grammer/ParseState.js";
import StringReader from "./common/StringReader.js";
import {executeSnbtOperation} from "./operations.js";

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
      builder += "\\\\";
    } else if (c != "\"" && c != "'") {
      const controlChar = escapeControlCharacters(c);
      if (controlChar != null) {
        builder += "\\";
        builder += controlChar;
      } else {
        builder += c;
      }
    } else {
      if (!quote) {
        quote = c == "\"" ? "'" : "\"";
      }
      if (quote == c) {
        builder += "\\";
      }
      builder += c;
    }
  }
  if (!quote) {
    quote = "\"";
  }
  return quote + builder + quote;
};

const SIMPLE_VALUE_REGEX = /^[A-Za-z0-9._+-]+$/;
const isSimpleTagKey = (key: string): boolean => {
  return IGNORE_CASE_COMPARATOR.compare(key, "true") !== 0
      && IGNORE_CASE_COMPARATOR.compare(key, "false") !== 0
      && SIMPLE_VALUE_REGEX.test(key);
};

const handleEscape = (key: string): string => {
  return isSimpleTagKey(key) ? key : quoteAndEscape(key);
};

const INDENT_CHAR = " ";
const genIndent = (indent: number, indentLevel: number): string => {
  return indent > 0 ? "\n" + INDENT_CHAR.repeat(indent * indentLevel) : "";
};

export abstract class Tag<T> {
  private readonly type: NbtType;
  private readonly value: T;

  constructor(type: NbtType, value: T) {
    this.type = type;
    this.value = value;
  }

  public asString(indent: number = 0): string {
    return this.asString0(indent, 0);
  }

  abstract asString0(indent: number, indentLevel: number): string;

  public resolve(state: ParseState<StringReader>): Tag<any> | undefined {
    return this;
  }

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
export abstract class ArrayTag<T> extends Tag<T[]> {
}

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
    if (indent > 0) {
      builder += " ";
    }
    for (let i = 0; i < value.length; i++) {
      if (i != 0) {
        builder += ",";
        if (indent > 0) {
          builder += " ";
        }
      }
      const val = value[i];
      if (typeof val === "boolean") {
        builder += `${val}`;
      } else {
        builder += val + "B";
      }
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
  private readonly listType?: NbtType;

  constructor(type?: NbtType, value: T[] = new Array<T>()) {
    super(NbtType.LIST, value);
    this.listType = type;
  }

  private newlines() {
    const listType = this.getListType();
    return listType === NbtType.COMPOUND || listType === NbtType.LIST || listType === NbtType.BYTE_ARRAY
        || listType === NbtType.INT_ARRAY || listType === NbtType.LONG_ARRAY;
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
    if (indent > 0) {
      builder += " ";
    }
    for (let i = 0; i < value.length; i++) {
      if (i != 0) {
        builder += ",";
        if (indent > 0) {
          builder += " ";
        }
      }
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
    if (indent > 0) {
      builder += " ";
    }
    for (let i = 0; i < value.length; i++) {
      if (i != 0) {
        builder += ",";
        if (indent > 0) {
          builder += " ";
        }
      }
      builder += value[i] + "L";
    }
    return builder + "]";
  }
}

// virtual tag, doesn't exist in vanilla minecraft
export class BooleanTag extends NumberTag<boolean> {
  constructor(value: boolean) {
    super(NbtType.BYTE, value);
  }
  static true() {
    return BOOLEAN_TRUE;
  }
  static false() {
    return BOOLEAN_FALSE;
  }
  public getNumber(): number {
    return this.getValue() ? 1 : 0;
  }
  asString0(indent: number, indentLevel: number): string {
    return this.getValue() ? "true" : "false";
  }
  resolve(state: ParseState<StringReader>): Tag<any> | undefined {
    const tag = this.getValue() ? new ByteTag(1) : new ByteTag(0);
    return tag.resolve(state);
  }
}
const BOOLEAN_TRUE = new BooleanTag(true);
const BOOLEAN_FALSE = new BooleanTag(false);

// virtual tag to represent SNBT operations
export type SnbtOperation = {
  operation: string;
  arguments: Tag<any>[];
}
export class SnbtOperationTag extends Tag<SnbtOperation> {
  constructor(value: SnbtOperation) {
    super(undefined, value);
  }
  asString0(indent: number, indentLevel: number): string {
    const {operation, arguments: args} = this.getValue();
    const argsString = args
        .map(tag => tag.asString0(indent, indentLevel))
        .join(`,${indent ? " " : ""}`);
    return `${operation}(${argsString})`;
  }
  resolve(state: ParseState<StringReader>): Tag<any> | undefined {
    const {operation, arguments: args} = this.getValue();
    const operatedTag = executeSnbtOperation(state, operation, args);
    return operatedTag?.resolve(state);
  }
}
