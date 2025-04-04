import {CachedParseState} from "../CachedParseState.js";
import StringReader from "../../common/StringReader.js";
import ErrorCollector from "../ErrorCollector.js";

export default class StringReaderParserState extends CachedParseState<StringReader> {
  private readonly input: StringReader;

  constructor(errorCollector: ErrorCollector<StringReader>, input: StringReader) {
    super(errorCollector);
    this.input = input;
  }

  getInput(): StringReader {
    return this.input;
  }

  mark(): number {
    return this.input.getCursor();
  }

  restore(cursor: number) {
    this.input.setCursor(cursor);
  }
}
