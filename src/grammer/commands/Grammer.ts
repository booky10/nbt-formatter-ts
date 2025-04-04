import Dictionary from "../Dictionary.js";
import StringReader from "../../common/StringReader.js";
import NamedRule from "../NamedRule.js";
import ParseState from "../ParseState.js";
import {ErrorCollectorLongestOnly} from "../ErrorCollector.js";
import StringReaderParserState from "./StringReaderParserState.js";

export default class Grammer<T> {
  private readonly rules: Dictionary<StringReader>;
  private readonly top: NamedRule<StringReader, T>;

  constructor(rules: Dictionary<StringReader>, top: NamedRule<StringReader, T>) {
    rules.checkAllBound();
    this.rules = rules;
    this.top = top;
  }

  public parse(state: ParseState<StringReader>): T | undefined {
    return state.parseTopRule(this.top);
  }

  public parseForCommands(reader: StringReader): T {
    const errorCollector = new ErrorCollectorLongestOnly<StringReader>();
    const state = new StringReaderParserState(errorCollector, reader);

    const result = this.parse(state);
    if (result !== undefined && result !== null) {
      return result;
    }

    const entries = errorCollector.getEntries()
      .filter(entry => entry.getReason() instanceof Error)
      .map(entry => entry.getReason() as Error);

    if (entries.length === 1) {
      throw entries[0];
    } else {
      throw new Error(`Failed to parse: ${entries.join(", ")}`);
    }
  }
}
