import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import ParseState from "../ParseState.js";

export default class UnquotedStringParseRule implements Rule<StringReader, string> {
  private readonly minSize: number;
  private readonly error: () => Error;

  constructor(minSize: number, error: () => Error) {
    this.minSize = minSize;
    this.error = error;
  }

  parse(state: ParseState<StringReader>): string | undefined {
    state.getInput().skipWhitespace();
    const cursor = state.mark();
    const string = state.getInput().readUnquotedString();
    if (string.length < this.minSize) {
      state.getErrorCollector().store(cursor, this.error());
      return undefined;
    } else {
      return string;
    }
  }
}
