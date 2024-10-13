import { CompoundTag, Tag } from "./tags.js";

const isWhitespace = (char: string): boolean => {
  // should be same behaviour as java's Character#isWhitespace
  return /[\s\u001C\u001D\u001E\u001F]/g.test(char);
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

  public skip() {
    this.cursor++;
  }

  public skipWhitespace() {
    while (this.canRead() && isWhitespace(this.peek())) {
      this.skip();
    }
  }
}

class TagParser {
  private reader: StringReader;

  constructor(reader: StringReader) {
    this.reader = reader;
  }

  public readSingleStruct(): CompoundTag {
    throw new Error("TODO");
  }
}

export const parseTag = (string: string): CompoundTag => {
  const reader = new StringReader(string);
  const parser = new TagParser(reader);
  return parser.readSingleStruct();
};
