import {
  ArrayTag,
  BooleanTag,
  ByteArrayTag,
  ByteTag,
  CompoundTag,
  DoubleTag,
  FloatTag,
  IntArrayTag,
  IntTag,
  ListTag,
  LongArrayTag,
  LongTag,
  NbtType,
  ShortTag,
  StringTag,
  Tag,
} from "./tags.js";
import StringReader, {isQuotedStringStart} from "./grammer/StringReader.js";

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
      return new BooleanTag(true);
    } else if ("false" === string) {
      return new BooleanTag(false);
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
