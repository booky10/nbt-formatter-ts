import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import {INTEGER_MAX_VALUE} from "../../common/util.js";
import ParseState from "../ParseState.js";

export default abstract class GreedyPredicateParseRule implements Rule<StringReader, string> {
  private readonly minSize: number;
  private readonly maxSize: number;
  private readonly error: () => Error;

  constructor(minSize: number, maxSize: number = INTEGER_MAX_VALUE, error: () => Error) {
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.error = error;
  }

  parse(state: ParseState<StringReader>): string | undefined {
    const reader = state.getInput();
    const string = reader.getString();

    const start = reader.getCursor();
    let end = start;
    while (end < string.length && this.isAccepted(string.charAt(end)) && end - start < this.maxSize) {
      end++;
    }

    const length = end - start;
    if (length < this.minSize) {
      state.getErrorCollector().store(state.mark(), this.error());
      return undefined;
    } else {
      reader.setCursor(end);
      return string.substring(start, end);
    }
  }

  protected abstract isAccepted(c: string): boolean;
}
