export const SYNTAX_ESCAPE = "\\";
export const SYNTAX_DOUBLE_QUOTE = "\"";
export const SYNTAX_SINGLE_QUOTE = "'";

export const isWhitespace = (char: string): boolean => {
  // should be same behaviour as java's Character#isWhitespace
  return /[\s\u001C\u001D\u001E\u001F]/g.test(char);
};

export const isQuotedStringStart = (char: string): boolean => {
  return char === SYNTAX_DOUBLE_QUOTE || char === SYNTAX_SINGLE_QUOTE;
};

export const isAllowedInUnquotedString = (c: string): boolean => {
  return (c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || c == "_" || c == "-" || c == "." || c == "+";
};

export default class StringReader {
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
