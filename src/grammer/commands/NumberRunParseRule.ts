import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import ParseState from "../ParseState.js";

export default abstract class NumberRunParseRule implements Rule<StringReader, string> {
  private readonly noValueError: () => Error;
  private readonly underscoreNotAllowedError: () => Error;

  constructor(noValueError: () => Error, underscoreNotAllowedError: () => Error) {
    this.noValueError = noValueError;
    this.underscoreNotAllowedError = underscoreNotAllowedError;
  }

  parse(state: ParseState<StringReader>): string | undefined {
    const reader = state.getInput();
    reader.skipWhitespace();
    const string = reader.getString();

    const start = reader.getCursor();
    let end = start;
    while (end < string.length && this.isAccepted(string.charAt(end))) {
      end++;
    }

    const length = end - start;
    if (length === 0) {
      state.getErrorCollector().store(state.mark(), this.noValueError());
      return undefined;
    } else if (string.charAt(start) !== "_" && string.charAt(end - 1) !== "_") {
      reader.setCursor(end);
      return string.substring(start, end);
    } else {
      state.getErrorCollector().store(state.mark(), this.underscoreNotAllowedError());
      return undefined;
    }
  }

  protected abstract isAccepted(c: string): boolean;
}
