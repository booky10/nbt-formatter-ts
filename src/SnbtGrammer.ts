import NumberRunParseRule from "./grammer/commands/NumberRunParseRule.js";
import GreedyPredicateParseRule from "./grammer/commands/GreedyPredicateParseRule.js";
import {IGNORE_CASE_COMPARATOR, INTEGER_MAX_VALUE, isValidCodePoint, MapEntry} from "./common/util.js";
import StringReaderTerms, {TerminalCharacters} from "./grammer/commands/StringReaderTerms.js";
import StringBuilder from "./common/StringBuilder.js";
import ParseState from "./grammer/ParseState.js";
import {
  ArrayTag, BooleanTag,
  ByteArrayTag,
  ByteTag, CompoundTag,
  DoubleTag,
  FloatTag, IntArrayTag,
  IntTag, ListTag, LongArrayTag,
  LongTag,
  NumberTag,
  ShortTag, SnbtOperationTag, StringTag, Tag,
} from "./tags.js";
import Grammer from "./grammer/commands/Grammer.js";
import Dictionary from "./grammer/Dictionary.js";
import StringReader from "./common/StringReader.js";
import Atom from "./grammer/Atom.js";
import {
  AlternativeTerm,
  CutTerm,
  FailTerm, LookAheadTerm,
  MarkerTerm,
  OptionalTerm,
  RepeatedTerm, RepeatedWithSeparatorTerm,
  SequenceTerm,
} from "./grammer/Term.js";
import GreedyPatternParseRule from "./grammer/commands/GreedyPatternParseRule.js";
import UnquotedStringParseRule from "./grammer/commands/UnquotedStringParseRule.js";

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

export const createParser = (): Grammer<Tag<any>> => {
  const dictionary = new Dictionary<StringReader>();

  const atomSign = new Atom<Sign>("sign");
  dictionary.put(
      atomSign,
      new AlternativeTerm(
          new SequenceTerm(StringReaderTerms.character("+"), new MarkerTerm(atomSign, Sign.PLUS)),
          new SequenceTerm(StringReaderTerms.character("-"), new MarkerTerm(atomSign, Sign.MINUS)),
      ),
      state => state.getScope().getOrThrow(atomSign),
  );

  const atomIntegerSuffix = new Atom<IntegerSuffix>("integer_suffix");
  dictionary.put(
      atomIntegerSuffix,
      new AlternativeTerm(
          new SequenceTerm(
              StringReaderTerms.characters("u", "U"),
              new AlternativeTerm(
                  new SequenceTerm(
                      StringReaderTerms.characters("b", "B"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.UNSIGNED, type: TypeSuffix.BYTE}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("s", "S"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.UNSIGNED, type: TypeSuffix.SHORT}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("i", "I"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.UNSIGNED, type: TypeSuffix.INT}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("l", "L"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.UNSIGNED, type: TypeSuffix.LONG}),
                  ),
              ),
          ),
          new SequenceTerm(
              StringReaderTerms.characters("s", "S"),
              new AlternativeTerm(
                  new SequenceTerm(
                      StringReaderTerms.characters("b", "B"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.SIGNED, type: TypeSuffix.BYTE}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("s", "S"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.SIGNED, type: TypeSuffix.SHORT}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("i", "I"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.SIGNED, type: TypeSuffix.INT}),
                  ),
                  new SequenceTerm(
                      StringReaderTerms.characters("l", "L"),
                      new MarkerTerm(atomIntegerSuffix, {signed: SignedPrefix.SIGNED, type: TypeSuffix.LONG}),
                  ),
              ),
          ),
          new SequenceTerm(
              StringReaderTerms.characters("b", "B"),
              new MarkerTerm(atomIntegerSuffix, {signed: undefined, type: TypeSuffix.BYTE}),
          ),
          new SequenceTerm(
              StringReaderTerms.characters("s", "S"),
              new MarkerTerm(atomIntegerSuffix, {signed: undefined, type: TypeSuffix.SHORT}),
          ),
          new SequenceTerm(
              StringReaderTerms.characters("i", "I"),
              new MarkerTerm(atomIntegerSuffix, {signed: undefined, type: TypeSuffix.INT}),
          ),
          new SequenceTerm(
              StringReaderTerms.characters("l", "L"),
              new MarkerTerm(atomIntegerSuffix, {signed: undefined, type: TypeSuffix.LONG}),
          ),
      ),
      state => state.getScope().getOrThrow(atomIntegerSuffix),
  );

  const atomBinaryNumeral = new Atom<string>("binary_numeral");
  dictionary.putRule(atomBinaryNumeral, BINARY_NUMERAL);
  const atomDecimalNumeral = new Atom<string>("decimal_numeral");
  dictionary.putRule(atomDecimalNumeral, DECIMAL_NUMERAL);
  const atomHexNumeral = new Atom<string>("hex_numeral");
  dictionary.putRule(atomHexNumeral, HEX_NUMERAL);

  const atomIntegerLiteral = new Atom<IntegerLiteral>("integer_literal");
  const integerLiteralRule = dictionary.put(
      atomIntegerLiteral,
      new SequenceTerm(
          new OptionalTerm(dictionary.named(atomSign)),
          new AlternativeTerm(
              new SequenceTerm(
                  StringReaderTerms.character("0"),
                  new CutTerm(),
                  new AlternativeTerm(
                      new SequenceTerm(StringReaderTerms.characters("x", "X"), new CutTerm(), dictionary.named(atomHexNumeral)),
                      new SequenceTerm(StringReaderTerms.characters("b", "B"), dictionary.named(atomBinaryNumeral)),
                      new SequenceTerm(dictionary.named(atomDecimalNumeral), new CutTerm(), new FailTerm(ERROR_LEADING_ZERO_NOT_ALLOWED)),
                      new MarkerTerm(atomDecimalNumeral, "0"),
                  ),
              ),
              dictionary.named(atomDecimalNumeral),
          ),
          new OptionalTerm(dictionary.named(atomIntegerSuffix)),
      ),
      state => {
        const suffix = state.getScope().getOrDefault(atomIntegerSuffix, INTEGER_SUFFIX_EMPTY);
        const sign = state.getScope().getOrDefault(atomSign, Sign.PLUS);
        const decimalDigits = state.getScope().get(atomDecimalNumeral);
        if (decimalDigits !== undefined && decimalDigits !== null) {
          return new IntegerLiteral(sign, Base.DECIMAL, decimalDigits, suffix);
        }
        const hexDigits = state.getScope().get(atomHexNumeral);
        if (hexDigits !== undefined && hexDigits !== null) {
          return new IntegerLiteral(sign, Base.HEX, hexDigits, suffix);
        }
        const binaryDigits = state.getScope().getOrThrow(atomBinaryNumeral);
        return new IntegerLiteral(sign, Base.BINARY, binaryDigits, suffix);
      },
  );

  const atomFloatTypeSuffix = new Atom<TypeSuffix>("float_type_suffix");
  dictionary.put(
      atomFloatTypeSuffix,
      new AlternativeTerm(
          new SequenceTerm(StringReaderTerms.characters("f", "F"), new MarkerTerm(atomFloatTypeSuffix, TypeSuffix.FLOAT)),
          new SequenceTerm(StringReaderTerms.characters("d", "D"), new MarkerTerm(atomFloatTypeSuffix, TypeSuffix.DOUBLE)),
      ),
      state => state.getScope().getOrThrow(atomFloatTypeSuffix),
  );
  const atomFloatExponentPart = new Atom<Signed<string>>("float_exponent_part");
  dictionary.put(
      atomFloatExponentPart,
      new SequenceTerm(StringReaderTerms.characters("e", "E"), new OptionalTerm(dictionary.named(atomSign)), dictionary.named(atomDecimalNumeral)),
      state => {
        return {
          sign: state.getScope().getOrDefault(atomSign, Sign.PLUS),
          value: state.getScope().getOrThrow(atomDecimalNumeral),
        };
      },
  );

  const atomFloatWholePart = new Atom<string>("float_whole_part");
  const atomFloatFractionPart = new Atom<string>("float_fraction_part");
  const atomFloatLiteral = new Atom<NumberTag<any>>("float_literal");
  dictionary.putComplex(
      atomFloatLiteral,
      new SequenceTerm(
          new OptionalTerm(dictionary.named(atomSign)),
          new AlternativeTerm(
              new SequenceTerm(
                  dictionary.namedWithAlias(atomDecimalNumeral, atomFloatWholePart),
                  StringReaderTerms.character("."),
                  new CutTerm(),
                  new OptionalTerm(dictionary.namedWithAlias(atomDecimalNumeral, atomFloatFractionPart)),
                  new OptionalTerm(dictionary.named(atomFloatExponentPart)),
                  new OptionalTerm(dictionary.named(atomFloatTypeSuffix)),
              ),
              new SequenceTerm(
                  StringReaderTerms.character("."),
                  new CutTerm(),
                  dictionary.namedWithAlias(atomDecimalNumeral, atomFloatFractionPart),
                  new OptionalTerm(dictionary.named(atomFloatExponentPart)),
                  new OptionalTerm(dictionary.named(atomFloatTypeSuffix)),
              ),
              new SequenceTerm(
                  dictionary.namedWithAlias(atomDecimalNumeral, atomFloatWholePart),
                  dictionary.named(atomFloatExponentPart),
                  new CutTerm(),
                  new OptionalTerm(dictionary.named(atomFloatTypeSuffix)),
              ),
              new SequenceTerm(
                  dictionary.namedWithAlias(atomDecimalNumeral, atomFloatWholePart),
                  new OptionalTerm(dictionary.named(atomFloatExponentPart)),
                  dictionary.named(atomFloatTypeSuffix),
              ),
          ),
      ),
      state => {
        const sign = state.getScope().getOrDefault(atomSign, Sign.PLUS);
        const wholePart = state.getScope().get(atomFloatWholePart);
        const fractionPart = state.getScope().get(atomFloatFractionPart);
        const exponentPart = state.getScope().get(atomFloatExponentPart);
        const suffix = state.getScope().get(atomFloatTypeSuffix);
        return createFloat(sign, wholePart, fractionPart, exponentPart, suffix, state);
      },
  );

  const atomStringHex2 = new Atom<string>("string_hex_2");
  dictionary.putRule(atomStringHex2, new SimpleHexLiteralParseRule(2));
  const atomStringHex4 = new Atom<string>("string_hex_4");
  dictionary.putRule(atomStringHex4, new SimpleHexLiteralParseRule(4));
  const atomStringHex8 = new Atom<string>("string_hex_8");
  dictionary.putRule(atomStringHex8, new SimpleHexLiteralParseRule(8));

  const atomStringUnicodeName = new Atom<string>("string_unicode_name");
  dictionary.putRule(atomStringUnicodeName, new GreedyPatternParseRule(UNICODE_NAME, ERROR_INVALID_CHARACTER_NAME));
  const atomStringEscapeSequence = new Atom<string>("string_escape_sequence");
  dictionary.putComplex(
      atomStringEscapeSequence,
      new AlternativeTerm(
          new SequenceTerm(StringReaderTerms.character("b"), new MarkerTerm(atomStringEscapeSequence, "\b")),
          new SequenceTerm(StringReaderTerms.character("s"), new MarkerTerm(atomStringEscapeSequence, " ")),
          new SequenceTerm(StringReaderTerms.character("t"), new MarkerTerm(atomStringEscapeSequence, "\t")),
          new SequenceTerm(StringReaderTerms.character("n"), new MarkerTerm(atomStringEscapeSequence, "\n")),
          new SequenceTerm(StringReaderTerms.character("f"), new MarkerTerm(atomStringEscapeSequence, "\f")),
          new SequenceTerm(StringReaderTerms.character("r"), new MarkerTerm(atomStringEscapeSequence, "\r")),
          new SequenceTerm(StringReaderTerms.character("\\"), new MarkerTerm(atomStringEscapeSequence, "\\")),
          new SequenceTerm(StringReaderTerms.character("'"), new MarkerTerm(atomStringEscapeSequence, "'")),
          new SequenceTerm(StringReaderTerms.character("\""), new MarkerTerm(atomStringEscapeSequence, "\"")),
          new SequenceTerm(StringReaderTerms.character("x"), dictionary.named(atomStringHex2)),
          new SequenceTerm(StringReaderTerms.character("u"), dictionary.named(atomStringHex4)),
          new SequenceTerm(StringReaderTerms.character("U"), dictionary.named(atomStringHex8)),
          new SequenceTerm(
              StringReaderTerms.character("N"),
              StringReaderTerms.character("{"),
              dictionary.named(atomStringUnicodeName),
              StringReaderTerms.character("}"),
          ),
      ),
      state => {
        const escapeSequence = state.getScope().getAny(atomStringEscapeSequence);
        if (escapeSequence !== undefined && escapeSequence !== null) {
          return escapeSequence;
        }
        const anyHexString = state.getScope().getAny(atomStringHex2, atomStringHex4, atomStringHex8);
        if (anyHexString !== undefined && anyHexString !== null) {
          const codePoint = parseInt(anyHexString, Base.HEX);
          if (!isValidCodePoint(codePoint)) {
            state.getErrorCollector().store(state.mark(), ERROR_INVALID_CODEPOINT(codePoint));
            return undefined;
          }
          return String.fromCodePoint(codePoint);
        }
        const unicodeName = state.getScope().getOrThrow(atomStringUnicodeName);
        // TODO: how to re-implement Character#codePointOf?
        state.getErrorCollector().store(state.mark(), ERROR_INVALID_CHARACTER_NAME);
        return undefined;
      },
  );

  const atomStringPlainContents = new Atom<string>("string_plain_contents");
  dictionary.putRule(atomStringPlainContents, PLAIN_STRING_CHUNK);
  const atomStringChunks = new Atom<string[]>("string_chunks");
  const atomStringContents = new Atom<string>("string_contents");
  const atomSingleQuotedStringChunk = new Atom<string>("single_quoted_string_chunk");
  const singleQuotedStringChunkRule = dictionary.put(
      atomSingleQuotedStringChunk,
      new AlternativeTerm(
          dictionary.namedWithAlias(atomStringPlainContents, atomStringContents),
          new SequenceTerm(
              StringReaderTerms.character("\\"),
              dictionary.namedWithAlias(atomStringEscapeSequence, atomStringContents),
          ),
          new SequenceTerm(
              StringReaderTerms.character("\""),
              new MarkerTerm(atomStringContents, "\""),
          ),
      ),
      state => state.getScope().getOrThrow(atomStringContents),
  );
  const atomSingleQuotedStringContents = new Atom<string>("single_quoted_string_contents");
  dictionary.put(
      atomSingleQuotedStringContents,
      new RepeatedTerm(singleQuotedStringChunkRule, atomStringChunks),
      state => state.getScope().getOrThrow(atomStringChunks).join(""),
  );

  const atomDoubleQuotedStringChunk = new Atom<string>("double_quoted_string_chunk");
  const doubleQuotedStringChunkRule = dictionary.put(
      atomDoubleQuotedStringChunk,
      new AlternativeTerm(
          dictionary.namedWithAlias(atomStringPlainContents, atomStringContents),
          new SequenceTerm(
              StringReaderTerms.character("\\"),
              dictionary.namedWithAlias(atomStringEscapeSequence, atomStringContents),
          ),
          new SequenceTerm(
              StringReaderTerms.character("'"),
              new MarkerTerm(atomStringContents, "'"),
          ),
      ),
      state => state.getScope().getOrThrow(atomStringContents),
  );
  const atomDoubleQuotedStringContents = new Atom<string>("double_quoted_string_contents");
  dictionary.put(
      atomDoubleQuotedStringContents,
      new RepeatedTerm(doubleQuotedStringChunkRule, atomStringChunks),
      state => state.getScope().getOrThrow(atomStringChunks).join(""),
  );

  const atomQuotedStringLiteral = new Atom<string>("quoted_string_literal");
  dictionary.put(
      atomQuotedStringLiteral,
      new AlternativeTerm(
          new SequenceTerm(
              StringReaderTerms.character("\""),
              new CutTerm(),
              new OptionalTerm(dictionary.namedWithAlias(atomDoubleQuotedStringContents, atomStringContents)),
              StringReaderTerms.character("\""),
          ),
          new SequenceTerm(
              StringReaderTerms.character("'"),
              new OptionalTerm(dictionary.namedWithAlias(atomSingleQuotedStringContents, atomStringContents)),
              StringReaderTerms.character("'"),
          ),
      ),
      state => state.getScope().getOrThrow(atomStringContents),
  );
  const atomUnquotedString = new Atom<string>("unquoted_string");
  dictionary.putRule(atomUnquotedString, new UnquotedStringParseRule(1, ERROR_EXPECTED_UNQUOTED_STRING));

  const atomLiteral = new Atom<Tag<any>>("literal");
  const atomArguments = new Atom<Tag<any>[]>("arguments");
  dictionary.put(
      atomArguments,
      new RepeatedWithSeparatorTerm(
          dictionary.forward(atomLiteral),
          atomArguments,
          StringReaderTerms.character(","),
      ),
      state => state.getScope().getOrThrow(atomArguments),
  );

  const atomUnquotedStringOrBuiltin = new Atom<Tag<any>>("unquoted_string_or_builtin");
  dictionary.putComplex(
      atomUnquotedStringOrBuiltin,
      new SequenceTerm(
          dictionary.named(atomUnquotedString),
          new OptionalTerm(
              new SequenceTerm(
                  StringReaderTerms.character("("),
                  dictionary.named(atomArguments),
                  StringReaderTerms.character(")"),
              ),
          ),
      ),
      state => {
        const sequence = state.getScope().getOrThrow(atomUnquotedString);
        if (!sequence.length || !isAllowedToStartUnquotedString(sequence[0])) {
          state.getErrorCollector().store(state.mark(), ERROR_INVALID_UNQUOTED_START);
          return undefined;
        }
        const args = state.getScope().get(atomArguments);
        if (args !== undefined && args !== null) {
          // don't run snbt operations, instead retain them using a custom operation tag
          return new SnbtOperationTag({
            operation: sequence,
            arguments: args,
          });
        } else if (IGNORE_CASE_COMPARATOR.compare(sequence, "true") === 0) {
          return BooleanTag.true();
        } else if (IGNORE_CASE_COMPARATOR.compare(sequence, "false") === 0) {
          return BooleanTag.false();
        } else {
          return new StringTag(sequence);
        }
      },
  );

  const atomMapKey = new Atom<string>("map_key");
  dictionary.put(
      atomMapKey,
      new AlternativeTerm(
          dictionary.named(atomQuotedStringLiteral),
          dictionary.named(atomUnquotedString),
      ),
      state => state.getScope().getAnyOrThrow(atomQuotedStringLiteral, atomUnquotedString),
  );
  const atomMapEntry = new Atom<MapEntry<string, Tag<any>>>("map_entry");
  const mapEntryRule = dictionary.putComplex(
      atomMapEntry,
      new SequenceTerm(
          dictionary.named(atomMapKey),
          StringReaderTerms.character(":"),
          dictionary.named(atomLiteral),
      ),
      state => {
        const key = state.getScope().getOrThrow(atomMapKey);
        if (!key.length) {
          state.getErrorCollector().store(state.mark(), ERROR_EMPTY_KEY);
          return undefined;
        }
        const tag = state.getScope().getOrThrow(atomLiteral);
        return {key, value: tag};
      },
  );
  const atomMapEntries = new Atom<MapEntry<string, Tag<any>>[]>("map_entries");
  dictionary.put(
      atomMapEntries,
      new RepeatedWithSeparatorTerm(
          mapEntryRule,
          atomMapEntries,
          StringReaderTerms.character(","),
      ),
      state => state.getScope().getOrThrow(atomMapEntries),
  );
  const atomMapLiteral = new Atom<CompoundTag>("map_literal");
  dictionary.put(
      atomMapLiteral,
      new SequenceTerm(
          // TODO paper tracks depth here
          StringReaderTerms.character("{"),
          dictionary.named(atomMapEntries),
          StringReaderTerms.character("}"),
      ),
      state => {
        const entries = state.getScope().getOrThrow(atomMapEntries);
        const tag = new CompoundTag();
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          tag.set(entry.key, entry.value);
        }
        return tag;
      },
  );

  const atomListEntries = new Atom<Tag<any>[]>("list_entries");
  dictionary.put(
      atomListEntries,
      new RepeatedWithSeparatorTerm(
          dictionary.forward(atomLiteral),
          atomListEntries,
          StringReaderTerms.character(","),
      ),
      state => state.getScope().getOrThrow(atomListEntries),
  );
  const atomArrayPrefix = new Atom<ArrayPrefix<any>>("array_prefix");
  dictionary.put(
      atomArrayPrefix,
      new AlternativeTerm(
          new SequenceTerm(
              StringReaderTerms.character("B"),
              new MarkerTerm(atomArrayPrefix, ARRAY_PREFIX_BYTE),
          ),
          new SequenceTerm(
              StringReaderTerms.character("L"),
              new MarkerTerm(atomArrayPrefix, ARRAY_PREFIX_LONG),
          ),
          new SequenceTerm(
              StringReaderTerms.character("I"),
              new MarkerTerm(atomArrayPrefix, ARRAY_PREFIX_INT),
          ),
      ),
      state => state.getScope().getOrThrow(atomArrayPrefix),
  );
  const atomIntArrayEntries = new Atom<IntegerLiteral[]>("int_array_entries");
  dictionary.put(
      atomIntArrayEntries,
      new RepeatedWithSeparatorTerm(
          integerLiteralRule,
          atomIntArrayEntries,
          StringReaderTerms.character(","),
      ),
      state => state.getScope().getOrThrow(atomIntArrayEntries),
  );
  const atomListLiteral = new Atom<ArrayTag<any>>("list_literal");
  dictionary.putComplex(
      atomListLiteral,
      new SequenceTerm(
          // TODO paper tracks depth here
          StringReaderTerms.character("["),
          new AlternativeTerm(
              new SequenceTerm(
                  dictionary.named(atomArrayPrefix),
                  StringReaderTerms.character(";"),
                  dictionary.named(atomIntArrayEntries),
              ),
              dictionary.named(atomListEntries),
          ),
          StringReaderTerms.character("]"),
      ),
      state => {
        const arrayPrefix = state.getScope().get(atomArrayPrefix);
        if (arrayPrefix !== undefined && arrayPrefix !== null) {
          const arrayEntries = state.getScope().getOrThrow(atomIntArrayEntries);
          return !arrayEntries.length ? arrayPrefix.createEmpty() : arrayPrefix.create(arrayEntries, state);
        }
        const listEntries = state.getScope().getOrThrow(atomListEntries);
        return !listEntries.length ? new ListTag() : new ListTag(listEntries[0].getType(), listEntries);
      },
  );

  const literalRule = dictionary.putComplex(
      atomLiteral,
      new AlternativeTerm(
          new SequenceTerm(
              new LookAheadTerm(NUMBER_LOOKAHEAD),
              new AlternativeTerm(
                  dictionary.namedWithAlias(atomFloatLiteral, atomLiteral),
                  dictionary.named(atomIntegerLiteral),
              ),
          ),
          new SequenceTerm(
              new LookAheadTerm(StringReaderTerms.characters("\"", "'")),
              new CutTerm(),
              dictionary.named(atomQuotedStringLiteral),
          ),
          new SequenceTerm(
              new LookAheadTerm(StringReaderTerms.character("{")),
              new CutTerm(),
              dictionary.namedWithAlias(atomMapLiteral, atomLiteral),
          ),
          new SequenceTerm(
              new LookAheadTerm(StringReaderTerms.character("[")),
              new CutTerm(),
              dictionary.namedWithAlias(atomListLiteral, atomLiteral),
          ),
          dictionary.namedWithAlias(atomUnquotedStringOrBuiltin, atomLiteral),
      ),
      state => {
        const string = state.getScope().get(atomQuotedStringLiteral);
        if (string !== undefined && string !== null) {
          return new StringTag(string);
        }
        const integer = state.getScope().get(atomIntegerLiteral);
        if (integer !== undefined && integer !== null) {
          return integer.create(state);
        }
        return state.getScope().getOrThrow(atomLiteral);
      },
  );

  return new Grammer<Tag<any>>(dictionary, literalRule);
};

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

enum TypeSuffix {
  FLOAT,
  DOUBLE,
  BYTE,
  SHORT,
  INT,
  LONG,
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
