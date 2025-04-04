import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import NamedRule from "../NamedRule.js";
import ResourceLocation from "../../common/ResourceLocation.js";
import ParseState from "../ParseState.js";

export default abstract class ResourceLookupRule<C, V> implements Rule<StringReader, V> {
  private readonly idParser: NamedRule<StringReader, ResourceLocation>;
  protected readonly context: C;
  private readonly error: () => Error;

  protected constructor(idParser: NamedRule<StringReader, ResourceLocation>, context: C, error: () => Error) {
    this.idParser = idParser;
    this.context = context;
    this.error = () => new Error("Error while reading ResourceLocation: Invalid ID");
  }

  parse(state: ParseState<StringReader>): V | undefined {
    state.getInput().skipWhitespace();
    const cursor = state.mark();
    const id = state.parse(this.idParser);
    if (id !== undefined && id !== null) {
      try {
        return this.validateElement(state.getInput(), id);
      } catch (error) {
        state.getErrorCollector().store(cursor, error);
        return undefined;
      }
    } else {
      state.getErrorCollector().store(cursor, this.error());
      return undefined;
    }
  }

  protected abstract validateElement(reader: StringReader, elementType: ResourceLocation): V;
}
