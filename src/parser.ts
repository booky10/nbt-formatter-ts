import { ArrayTag, ByteArrayTag, ByteTag, CompoundTag, DoubleTag, FloatTag, IntArrayTag, IntTag, ListTag, LongArrayTag, LongTag, NbtType, ShortTag, StringTag, Tag } from "./tags.js";

const SYNTAX_ESCAPE = "\\";
const SYNTAX_DOUBLE_QUOTE = '"';
const SYNTAX_SINGLE_QUOTE = "'";

const isWhitespace = (char: string): boolean => {
  // should be same behaviour as java's Character#isWhitespace
  return /[\s\u001C\u001D\u001E\u001F]/g.test(char);
};

const isQuotedStringStart = (char: string): boolean => {
  return char === SYNTAX_DOUBLE_QUOTE || char === SYNTAX_SINGLE_QUOTE;
};

const isAllowedInUnquotedString = (c: string): boolean => {
  return (c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || c == "_" || c == "-" || c == "." || c == "+";
};

class StringReader {
  private string: string;
  private cursor: number = 0;

  constructor(string: string) {
    this.string = string;
  }

  public canRead(length: number = 1): boolean {
    return this.cursor + length <= this.string.length;
  }

  public peek(offset: number = 0): string {
    return this.string.charAt(this.cursor + offset);
  }

  public read(): string {
    return this.string.charAt(this.cursor++);
  }

  public skip() {
    this.cursor++;
  }

  public skipWhitespace() {
    while (this.canRead() && isWhitespace(this.peek())) {
      this.skip();
    }
  }

  public readString(): string {
    if (!this.canRead()) {
      return "";
    }
    const next = this.peek();
    if (isQuotedStringStart(next)) {
      this.skip();
      return this.readStringUntil(next);
    }
    return this.readUnquotedString();
  }

  public readStringUntil(terminator: string): string {
    let result = "";
    let escaped = false;
    while (this.canRead()) {
      const c = this.read();
      if (escaped) {
        if (c === terminator || c === SYNTAX_ESCAPE) {
          result += c;
          escaped = false;
        } else {
          throw new Error("Reader: Invalid escape: " + c);
        }
      } else if (c === SYNTAX_ESCAPE) {
        escaped = true;
      } else if (c === terminator) {
        return result;
      } else {
        result += c;
      }
    }
    throw new Error("Reader: Expected end of quote");
  }

  public readUnquotedString(): string {
    const start = this.cursor;
    while (this.canRead() && isAllowedInUnquotedString(this.peek())) {
      this.skip();
    }
    return this.string.substring(start, this.cursor);
  }

  public readQuotedString(): string {
    if (!this.canRead()) {
      return "";
    }
    const next = this.peek();
    if (!isQuotedStringStart(next)) {
      throw new Error("Reader: Expected start of quote");
    }
    this.skip();
    return this.readStringUntil(next);
  }

  public getCursor(): number {
    return this.cursor;
  }

  public setCursor(cursor: number) {
    this.cursor = cursor;
  }

  public expect(char: string) {
    if (this.canRead() && this.peek() === char) {
      return this.skip();
    }
    throw new Error("Reader: Expected symbol: " + char);
  }
}

export const ELEMENT_SEPARATOR = ",";
export const NAME_VALUE_SEPARATOR = ":";
const LIST_OPEN = "[";
const LIST_CLOSE = "]";
const STRUCT_CLOSE = "}";
const STRUCT_OPEN = "{";

const DOUBLE_PATTERN_NOSUFFIX = /^[-+]?(?:[0-9]+[.]|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?$/i;
const DOUBLE_PATTERN = /^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?d$/i;
const FLOAT_PATTERN = /^[-+]?(?:[0-9]+[.]?|[0-9]*[.][0-9]+)(?:e[-+]?[0-9]+)?f$/i;
const BYTE_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)b$/i;
const LONG_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)l$/i;
const SHORT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)s$/i;
const INT_PATTERN = /^[-+]?(?:0|[1-9][0-9]*)$/;

class TagParser {
  private reader: StringReader;

  constructor(reader: StringReader) {
    this.reader = reader;
  }

  readSingleStruct(): CompoundTag {
    const tag = this.readStruct();
    this.reader.skipWhitespace();
    if (this.reader.canRead()) {
      throw new Error("Nbt: Found trailing data");
    }
    return tag;
  }

  protected readKey(): string {
    this.reader.skipWhitespace();
    if (this.reader.canRead()) {
      return this.reader.readString();
    }
    throw new Error("Nbt: Expected key");
  }

  protected readTypedValue(): Tag<any> {
    this.reader.skipWhitespace();
    const cursor = this.reader.getCursor();
    if (isQuotedStringStart(this.reader.peek())) {
      return new StringTag(this.reader.readQuotedString());
    }
    const string = this.reader.readUnquotedString();
    if (!string.length) {
      this.reader.setCursor(cursor);
      throw new Error("Nbt: Expected value");
    }
    return this.type(string);
  }

  private type(string: string): Tag<any> {
    if (FLOAT_PATTERN.test(string)) {
      return new FloatTag(Number(string.substring(0, string.length - 1)));
    } else if (BYTE_PATTERN.test(string)) {
      return new ByteTag(Number(string.substring(0, string.length - 1)));
    } else if (LONG_PATTERN.test(string)) {
      return new LongTag(BigInt(string.substring(0, string.length - 1)));
    } else if (SHORT_PATTERN.test(string)) {
      return new ShortTag(Number(string.substring(0, string.length - 1)));
    } else if (INT_PATTERN.test(string)) {
      return new IntTag(Number(string));
    } else if (DOUBLE_PATTERN.test(string)) {
      return new DoubleTag(Number(string.substring(0, string.length - 1)));
    } else if (DOUBLE_PATTERN_NOSUFFIX.test(string)) {
      return new DoubleTag(Number(string));
    } else if ("true" === string) {
      return new ByteTag(1);
    } else if ("false" === string) {
      return new ByteTag(0);
    } else {
      return new StringTag(string);
    }
  }

  public readValue(): Tag<any> {
    this.reader.skipWhitespace();
    if (!this.reader.canRead()) {
      throw new Error("Nbt: Expected value");
    }
    const next = this.reader.peek();
    if (next === STRUCT_OPEN) {
      return this.readStruct();
    } else if (next === LIST_OPEN) {
      return this.readList();
    } else {
      return this.readTypedValue();
    }
  }

  protected readList(): Tag<any> {
    if (this.reader.canRead(3) && !isQuotedStringStart(this.reader.peek(1)) && this.reader.peek(2) == ";") {
      return this.readArrayTag();
    }
    return this.readListTag();
  }

  public readStruct(): CompoundTag {
    this.expect(STRUCT_OPEN);
    this.reader.skipWhitespace();
    const tag = new CompoundTag();
    while (this.reader.canRead() && this.reader.peek() !== STRUCT_CLOSE) {
      const cursor = this.reader.getCursor();
      const key = this.readKey();
      if (!key.length) {
        this.reader.setCursor(cursor);
        throw new Error("Nbt: Expected key");
      }
      this.expect(NAME_VALUE_SEPARATOR);
      tag.set(key, this.readValue());
      if (!this.hasElementSeparator()) {
        break;
      }
      if (!this.reader.canRead()) {
        throw new Error("Nbt: Expected key");
      }
    }
    this.expect(STRUCT_CLOSE);
    return tag;
  }

  private readListTag(): ListTag<any> {
    this.expect(LIST_OPEN);
    this.reader.skipWhitespace();
    if (!this.reader.canRead()) {
      throw new Error("Nbt: Expected value");
    }
    const list = new ListTag();
    let type: NbtType | undefined = undefined;
    while (this.reader.peek() !== LIST_CLOSE) {
      const cursor = this.reader.getCursor();
      const value = this.readValue();
      const valueType = value.getType();
      if (type === undefined) {
        type = valueType;
      } else if (valueType !== type) {
        this.reader.setCursor(cursor);
        throw new Error("Nbt: Insert mixed list: expected " + type + ", got " + valueType);
      }
      list.add(value);
      if (!this.hasElementSeparator()) {
        break;
      }
      if (!this.reader.canRead()) {
        throw new Error("Nbt: Expected value");
      }
    }
    this.expect(LIST_CLOSE);
    return list;
  }

  private readArrayTag(): ArrayTag<any> {
    this.expect(LIST_OPEN);
    const cursor = this.reader.getCursor();
    const type = this.reader.read();
    this.reader.read();
    this.reader.skipWhitespace();
    if (!this.reader.canRead()) {
      throw new Error("Nbt: Expected value");
    } else if (type === "B") {
      return new ByteArrayTag(this.readArray(NbtType.BYTE_ARRAY, NbtType.BYTE));
    } else if (type === "L") {
      return new LongArrayTag(this.readArray(NbtType.LONG_ARRAY, NbtType.LONG));
    } else if (type === "I") {
      return new IntArrayTag(this.readArray(NbtType.INT_ARRAY, NbtType.INT));
    } else {
      this.reader.setCursor(cursor);
      throw new Error("Nbt: Invalid array: " + type);
    }
  }

  private readArray(listType: NbtType, type: NbtType): Array<any> {
    const array = [];
    while (this.reader.peek() !== LIST_CLOSE) {
      const cursor = this.reader.getCursor();
      const tag = this.readValue();
      const valueType = tag.getType();
      if (type !== valueType) {
        this.reader.setCursor(cursor);
        throw new Error("Nbt: Insert mixed array: expected " + type + ", got " + valueType);
      }
      array.push(tag.getValue());
      if (!this.hasElementSeparator()) {
        break;
      }
      if (!this.reader.canRead()) {
        throw new Error("Nbt: Expected value");
      }
    }
    this.expect(LIST_CLOSE);
    return array;
  }

  private hasElementSeparator(): boolean {
    this.reader.skipWhitespace();
    if (this.reader.canRead() && this.reader.peek() === ELEMENT_SEPARATOR) {
      this.reader.skip();
      this.reader.skipWhitespace();
      return true;
    }
    return false;
  }

  private expect(char: string) {
    this.reader.skipWhitespace();
    this.reader.expect(char);
  }
}

export const parseTag = (string: string): CompoundTag => {
  const reader = new StringReader(string);
  const parser = new TagParser(reader);
  return parser.readSingleStruct();
};
