import {CompoundTag, Tag} from "./tags.js";
import Grammer from "./grammer/commands/Grammer.js";
import {createParser} from "./SnbtGrammer.js";
import StringReader from "./common/StringReader.js";

class TagParser<T> {
  private readonly grammer: Grammer<T>;

  constructor(grammer: Grammer<T>) {
    this.grammer = grammer;
  }

  public parseFully(reader: StringReader) {
    const tag = this.grammer.parseForCommands(reader);
    reader.skipWhitespace();
    if (reader.canRead()) {
      throw new Error("Unexpected trailing data");
    }
    return tag;
  }
}

const TAG_PARSER = new TagParser<Tag<any>>(createParser(false));
const TAG_PARSER_RESOLVING = new TagParser<Tag<any>>(createParser(true));

export const parseTag = (string: string, resolve: boolean): CompoundTag => {
  const reader = new StringReader(string);
  const tag = (resolve ? TAG_PARSER_RESOLVING : TAG_PARSER).parseFully(reader);
  if (tag instanceof CompoundTag) {
    return tag;
  }
  throw new Error("Expected compound tag");
};
