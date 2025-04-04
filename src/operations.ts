import ParseState from "./grammer/ParseState.js";
import StringReader from "./common/StringReader.js";
import {BooleanTag, IntArrayTag, NumberTag, StringTag, Tag} from "./tags.js";
import * as uuid from "uuid";

const ERROR_EXPECTED_STRING_UUID = () =>
    new Error("Expected a string representing a valid UUID");
const ERROR_EXPECTED_NUMBER_OR_BOOLEAN = () =>
    new Error("Expected a number or a boolean");
const ERROR_NO_SUCH_OPERATION = (operation: string) =>
    new Error(`No such operation: ${operation}`);

type Operation = {
  argCount: number;
  execute: (state: ParseState<StringReader>, args: Tag<any>[]) => Tag<any> | undefined
};

const OPERATIONS_MAP: { [id: string]: Operation } = {
  bool: {
    argCount: 1,
    execute: (state, args) => {
      const tag = args[0];
      if (!(tag instanceof NumberTag)) {
        state.getErrorCollector().store(state.mark(), ERROR_EXPECTED_NUMBER_OR_BOOLEAN);
        return undefined;
      }
      const bool = tag.getNumber() !== 0;
      return new BooleanTag(bool);
    },
  },
  uuid: {
    argCount: 1,
    execute: (state, args) => {
      const tag = args[0];
      if (!(tag instanceof StringTag) || !uuid.validate(tag.getValue())) {
        state.getErrorCollector().store(state.mark(), ERROR_EXPECTED_STRING_UUID);
        return undefined;
      }
      const uuidBuf = uuid.parse(tag.getValue());
      return new IntArrayTag([
        (uuidBuf[0] << 24) | (uuidBuf[1] << 16) | (uuidBuf[2] << 8) | (uuidBuf[3] << 0),
        (uuidBuf[4] << 24) | (uuidBuf[5] << 16) | (uuidBuf[6] << 8) | (uuidBuf[7] << 0),
        (uuidBuf[8] << 24) | (uuidBuf[9] << 16) | (uuidBuf[10] << 8) | (uuidBuf[11] << 0),
        (uuidBuf[12] << 24) | (uuidBuf[13] << 16) | (uuidBuf[14] << 8) | (uuidBuf[15] << 0),
      ]);
    },
  },
};

export const executeSnbtOperation = (state: ParseState<StringReader>, id: string, args: Tag<any>[]): Tag<any> | undefined => {
  const operation = OPERATIONS_MAP[id];
  if (!operation || operation.argCount !== args.length) {
    state.getErrorCollector().store(state.mark(), ERROR_NO_SUCH_OPERATION(`${id}/${args.length}`));
    return undefined;
  }
  return operation.execute(state, args);
};
