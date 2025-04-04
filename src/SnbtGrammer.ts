import NumberRunParseRule from "./grammer/commands/NumberRunParseRule.js";
import GreedyPredicateParseRule from "./grammer/commands/GreedyPredicateParseRule.js";
import {INTEGER_MAX_VALUE} from "./common/util.js";
import {TerminalCharacters} from "./grammer/commands/StringReaderTerms.js";
import StringBuilder from "./common/StringBuilder.js";
import ParseState from "./grammer/ParseState.js";
import {
  ArrayTag,
  ByteArrayTag,
  ByteTag,
  DoubleTag,
  FloatTag, IntArrayTag,
  IntTag, LongArrayTag,
  LongTag,
  NumberTag,
  ShortTag,
} from "./tags.js";

const ERROR_NUMBER_PARSE_FAILURE = (error: string) =>
    new Error(`Failed to parse number: ${error}`);
const ERROR_EXPECTED_HEX_ESCAPE = (length: number) =>
    new Error(`Expected a character literal of length ${length}`);
const ERROR_INVALID_CODEPOINT = (codepoint: number) =>
    new Error(`Invalid Unicode character value: ${codepoint}`);
const ERROR_NO_SUCH_OPERATION = (operation: string) =>
    new Error(`No such operation: ${operation}`);
const ERROR_EXPECTED_INTEGER_TYPE = () =>
    new Error("Expected an integer number");
const ERROR_EXPECTED_FLOAT_TYPE = () =>
    new Error("Expected a floating point number");
const ERROR_EXPECTED_NON_NEGATIVE_NUMBER = () =>
    new Error("Expected a non-negative number");
const ERROR_INVALID_CHARACTER_NAME = () =>
    new Error("Invalid Unicode character name");
const ERROR_INVALID_ARRAY_ELEMENT_TYPE = () =>
    new Error("Invalid array element type");
const ERROR_INVALID_UNQUOTED_START = () =>
    new Error("Unquoted strings can't start with digits 0-9, + or -");
const ERROR_EXPECTED_UNQUOTED_STRING = () =>
    new Error("Expected a valid unquoted string");
const ERROR_INVALID_STRING_CONTENTS = () =>
    new Error("Invalid string contents");
const ERROR_EXPECTED_BINARY_NUMERAL = () =>
    new Error("Expected a binary number");
const ERROR_UNDERSCORE_NOT_ALLOWED = () =>
    new Error("Underscore characters are not allowed at the start or end of a number");
const ERROR_EXPECTED_DECIMAL_NUMERAL = () =>
    new Error("Expected a decimal number");
const ERROR_EXPECTED_HEX_NUMERAL = () =>
    new Error("Expected a hexadecimal number");
const ERROR_EMPTY_KEY = () =>
    new Error("Key cannot be empty");
const ERROR_LEADING_ZERO_NOT_ALLOWED = () =>
    new Error("Decimal numbers can't start with 0");
const ERROR_INFINITY_NOT_ALLOWED = () =>
    new Error("Non-finite numbers are not allowed");

const BINARY_NUMERAL = new (class BinaryNumberRunParseRule extends NumberRunParseRule {
  constructor() {
    super(ERROR_EXPECTED_BINARY_NUMERAL, ERROR_UNDERSCORE_NOT_ALLOWED);
  }
  protected isAccepted(c: string): boolean {
    switch (c) {
      case "0":
      case "1":
      case "_":
        return true;
      default:
        return false;
    }
  }
})();
const DECIMAL_NUMERAL = new (class DecimalNumberRunParseRule extends NumberRunParseRule {
  constructor() {
    super(ERROR_EXPECTED_DECIMAL_NUMERAL, ERROR_UNDERSCORE_NOT_ALLOWED);
  }
  protected isAccepted(c: string): boolean {
    switch (c) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "_":
        return true;
      default:
        return false;
    }
  }
})();
const HEX_NUMERAL = new (class DecimalNumberRunParseRule extends NumberRunParseRule {
  constructor() {
    super(ERROR_EXPECTED_HEX_NUMERAL, ERROR_UNDERSCORE_NOT_ALLOWED);
  }
  protected isAccepted(c: string): boolean {
    switch (c) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "A":
      case "B":
      case "C":
      case "D":
      case "E":
      case "F":
      case "_":
      case "a":
      case "b":
      case "c":
      case "d":
      case "e":
      case "f":
        return true;
      default:
        return false;
    }
  }
})();
const PLAIN_STRING_CHUNK = new (class PlainGreedyPredicateParseRule extends GreedyPredicateParseRule {
  constructor() {
    super(1, INTEGER_MAX_VALUE, ERROR_INVALID_STRING_CONTENTS);
  }
  protected isAccepted(c: string): boolean {
    switch (c) {
      case "\"":
      case "'":
      case "\\":
        return false;
      default:
        return true;
    }
  }
})();
const NUMBER_LOOKAHEAD = new (class SnbtNumberLookAhead extends TerminalCharacters {
  constructor() {
    super([]);
  }
  protected isAccepted(c: string): boolean {
    return canStartNumber(c);
  }
})();
const UNICODE_NAME = /[-a-zA-Z0-9 ]+/;

export const escapeControlCharacters = (c: string): string | undefined => {
  switch (c) {
    case "\b":
      return "b";
    case "\t":
      return "t";
    case "\n":
      return "n";
    case "\f":
      return "f";
    case "\r":
      return "r";
    default:
      if (c < " ") {
        return `x${c.charCodeAt(0).toString(16).toUpperCase()}`;
      }
      return undefined;
  }
};

const isAllowedToStartUnquotedString = (c: string) => {
  return !canStartNumber(c);
};

const canStartNumber = (c: string) => {
  switch (c) {
    case "+":
    case "-":
    case ".":
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return true;
    default:
      return false;
  }
};

const needsUnderscoreRemoval = (text: string) => {
  return text.indexOf("_") !== -1;
};

const cleanAndAppend = (builder: StringBuilder, text: string, removeUnderscores: boolean = needsUnderscoreRemoval(text)) => {
  if (removeUnderscores) {
    for (let i = 0; i < text.length; i++) {
      const c = text.charAt(i);
      if (c !== "_") {
        builder.append(c);
      }
    }
  } else {
    builder.append(text);
  }
};

const parseUnsignedShort = (text: string, radix: number) => {
  const num = parseInt(text, radix);
  if ((num >> 16) === 0) {
    return num;
  } else {
    throw new Error("out of range: " + num);
  }
};

const createFloat = (
    sign: Sign,
    wholePart: string | undefined,
    fractionPart: string | undefined,
    exponentPart: Signed<string> | undefined,
    suffix: TypeSuffix | undefined,
    state: ParseState<any>,
) => {
  let builder = new StringBuilder();
  builder.append(sign);
  if (wholePart !== undefined && wholePart !== null) {
    cleanAndAppend(builder, wholePart);
  }
  if (fractionPart !== undefined && fractionPart !== null) {
    builder.append(".");
    cleanAndAppend(builder, fractionPart);
  }
  if (exponentPart !== undefined && exponentPart !== null) {
    builder.append("e" + exponentPart.sign);
    cleanAndAppend(builder, exponentPart.value);
  }
  const string = builder.toString();

  if (suffix === undefined || suffix === null || suffix === TypeSuffix.DOUBLE) {
    return convertDouble(state, string);
  } else if (suffix === TypeSuffix.FLOAT) {
    return convertFloat(state, string);
  } else {
    state.getErrorCollector().store(state.mark(), ERROR_EXPECTED_FLOAT_TYPE);
    return undefined;
  }
};

const convertFloat = (state: ParseState<any>, value: string) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    state.getErrorCollector().store(state.mark(), ERROR_NUMBER_PARSE_FAILURE(`For input string: "${value}"`));
    return undefined;
  } else if (!isFinite(num)) {
    state.getErrorCollector().store(state.mark(), ERROR_INFINITY_NOT_ALLOWED);
    return undefined;
  } else {
    return new FloatTag(num);
  }
};

const convertDouble = (state: ParseState<any>, value: string) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    state.getErrorCollector().store(state.mark(), ERROR_NUMBER_PARSE_FAILURE(`For input string: "${value}"`));
    return undefined;
  } else if (!isFinite(num)) {
    state.getErrorCollector().store(state.mark(), ERROR_INFINITY_NOT_ALLOWED);
    return undefined;
  } else {
    return new DoubleTag(num);
  }
};

// TODO create grammer

abstract class ArrayPrefix<T extends ArrayTag<any>> {
  private readonly defaultType: TypeSuffix;
  private readonly additionalTypes: Set<TypeSuffix>;

  constructor(defaultType: TypeSuffix, ...additionalTypes: TypeSuffix[]) {
    this.defaultType = defaultType;
    this.additionalTypes = new Set<TypeSuffix>(additionalTypes);
  }

  public isAllowed(suffix: TypeSuffix) {
    return suffix === this.defaultType || this.additionalTypes.has(suffix);
  }

  public abstract createEmpty(): T;

  public abstract create(values: IntegerLiteral[], state: ParseState<any>): T | undefined

  protected buildNumber(value: IntegerLiteral, state: ParseState<any>): NumberTag<any> | undefined {
    const suffix = this.computeType(value.getSuffix());
    if (suffix === undefined || suffix === null) {
      state.getErrorCollector().store(state.mark(), ERROR_INVALID_ARRAY_ELEMENT_TYPE);
      return undefined;
    } else {
      return value.create(state, suffix);
    }
  }

  private computeType(suffix: IntegerSuffix): TypeSuffix | undefined {
    if (suffix.type === undefined || suffix.type === null) {
      return this.defaultType;
    } else {
      return !this.isAllowed(suffix.type) ? undefined : suffix.type;
    }
  }
}

const ARRAY_PREFIX_BYTE = new (class ByteArrayPrefix extends ArrayPrefix<ByteArrayTag> {
  constructor() {
    super(TypeSuffix.BYTE);
  }

  createEmpty(): ByteArrayTag {
    return new ByteArrayTag([]);
  }

  create(values: IntegerLiteral[], state: ParseState<any>): ByteArrayTag | undefined {
    const bytes = new Int8Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const num = this.buildNumber(values[i], state);
      if (num === undefined || num === null) {
        return undefined;
      }
      bytes[i] = num.getNumber();
    }
    return new ByteArrayTag([...bytes]);
  }
})();

const ARRAY_PREFIX_INT = new (class IntArrayPrefix extends ArrayPrefix<IntArrayTag> {
  constructor() {
    super(TypeSuffix.INT, TypeSuffix.BYTE, TypeSuffix.SHORT);
  }

  createEmpty(): IntArrayTag {
    return new IntArrayTag([]);
  }

  create(values: IntegerLiteral[], state: ParseState<any>): IntArrayTag | undefined {
    const ints = new Int32Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const num = this.buildNumber(values[i], state);
      if (num === undefined || num === null) {
        return undefined;
      }
      ints[i] = num.getNumber();
    }
    return new IntArrayTag([...ints]);
  }
})();

const ARRAY_PREFIX_LONG = new (class LongArrayPrefix extends ArrayPrefix<LongArrayTag> {
  constructor() {
    super(TypeSuffix.LONG, TypeSuffix.BYTE, TypeSuffix.SHORT, TypeSuffix.INT);
  }

  createEmpty(): LongArrayTag {
    return new LongArrayTag([]);
  }

  create(values: IntegerLiteral[], state: ParseState<any>): LongArrayTag | undefined {
    const longs = new BigInt64Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const num = this.buildNumber(values[i], state);
      if (num === undefined || num === null) {
        return undefined;
      }
      longs[i] = num instanceof LongTag ? num.getValue() : BigInt(num.getNumber());
    }
    return new LongArrayTag([...longs]);
  }
})();

enum Base {
  BINARY = 2,
  DECIMAL = 10,
  HEX = 16,
}

class IntegerLiteral {
  private readonly sign: Sign;
  private readonly base: Base;
  private readonly digits: string;
  private readonly suffix: IntegerSuffix;

  constructor(sign: Sign, base: Base, digits: string, suffix: IntegerSuffix) {
    this.sign = sign;
    this.base = base;
    this.digits = digits;
    this.suffix = suffix;
  }

  private signedOrDefault(): SignedPrefix {
    if (this.suffix.signed !== undefined && this.suffix.signed !== null) {
      return this.suffix.signed;
    }
    switch (this.base) {
      case Base.BINARY:
      case Base.HEX:
        return SignedPrefix.UNSIGNED;
      case Base.DECIMAL:
        return SignedPrefix.SIGNED;
    }
  }

  private cleanupDigits(sign: Sign): string {
    const underscores = needsUnderscoreRemoval(this.digits);
    if (sign !== Sign.MINUS && !underscores) {
      return this.digits;
    }
    const builder = new StringBuilder();
    builder.append(sign);
    cleanAndAppend(builder, this.digits, underscores);
    return builder.toString();
  }

  public create(state: ParseState<any>, suffix: TypeSuffix = this.suffix.type ?? TypeSuffix.INT): NumberTag<any> | undefined {
    const signed = this.signedOrDefault() === SignedPrefix.SIGNED;
    if (!signed && this.sign === Sign.MINUS) {
      state.getErrorCollector().store(state.mark(), ERROR_EXPECTED_NON_NEGATIVE_NUMBER);
      return undefined;
    }

    // TODO this doesn't support full java datatypes and proper unsigned logic is missing too
    const digits = this.cleanupDigits(this.sign);
    const num = parseInt(digits, this.base);
    if (isNaN(num) || !isFinite(num)) {
      state.getErrorCollector().store(state.mark(), ERROR_NUMBER_PARSE_FAILURE(`For input string: "${digits}"`));
      return undefined;
    }

    switch (suffix) {
      case TypeSuffix.BYTE:
        return new ByteTag(num);
      case TypeSuffix.SHORT:
        return new ShortTag(num);
      case TypeSuffix.INT:
        return new IntTag(num);
      case TypeSuffix.LONG:
        return new LongTag(BigInt(num));
      default:
        state.getErrorCollector().store(state.mark(), ERROR_EXPECTED_INTEGER_TYPE);
        return undefined;
    }
  }

  public getSign() {
    return this.sign;
  }

  public getBase() {
    return this.base;
  }

  public getDigits() {
    return this.digits;
  }

  public getSuffix() {
    return this.suffix;
  }
}

type IntegerSuffix = {
  signed: SignedPrefix | undefined,
  type: TypeSuffix | undefined,
}

const INTEGER_SUFFIX_EMPTY: IntegerSuffix = {
  signed: undefined,
  type: undefined,
};

enum Sign {
  PLUS = "",
  MINUS = "-",
}

type Signed<T> = {
  sign: Sign,
  value: T,
}

enum SignedPrefix {
  SIGNED,
  UNSIGNED,
}

class SimpleHexLiteralParseRule extends GreedyPredicateParseRule {
  constructor(minSize: number) {
    super(minSize, minSize, () => ERROR_EXPECTED_HEX_ESCAPE(minSize));
  }

  protected isAccepted(c: string): boolean {
    switch (c) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "A":
      case "B":
      case "C":
      case "D":
      case "E":
      case "F":
      case "a":
      case "b":
      case "c":
      case "d":
      case "e":
      case "f":
        return true;
      default:
        return false;
    }
  }
}

enum TypeSuffix {
  FLOAT,
  DOUBLE,
  BYTE,
  SHORT,
  INT,
  LONG,
}
