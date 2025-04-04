import Rule from "../Rule.js";
import StringReader from "../../common/StringReader.js";
import ResourceLocation from "../../common/ResourceLocation.js";
import ParseState from "../ParseState.js";

export default class ResourceLocationParseRule implements Rule<StringReader, ResourceLocation> {

  parse(state: ParseState<StringReader>): ResourceLocation | undefined {
    state.getInput().skipWhitespace();
    try {
      return ResourceLocation.readNonEmpty(state.getInput());
    } catch (error) {
      return undefined;
    }
  }
}
