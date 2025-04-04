import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import ParseState from "../ParseState.js";

export default class GreedyPatternParseRule implements Rule<StringReader, string> {
  private readonly pattern: RegExp;
  private readonly error: () => Error;

  constructor(pattern: RegExp, error: () => Error) {
    this.pattern = pattern;
    this.error = error;
  }

  parse(state: ParseState<StringReader>): string | undefined {
    const reader = state.getInput();
    const string = reader.getString();
    const regionString = string.substring(reader.getCursor(), string.length);
    const matcher = this.pattern.exec(regionString);
    if (!matcher) {
      state.getErrorCollector().store(state.mark(), this.error());
      return undefined;
    } else {
      reader.setCursor(this.pattern.lastIndex + matcher[0].length); // TODO is this correct?
      return matcher[0];
    }
  }
}
