import JInt, {JINT_MAX_VALUE, JINT_ONE_NEGATIVE, JINT_ONE_POSITIVE, JINT_TEN_POSITIVE, JINT_ZERO} from "./JInt.js";
import JDouble, {
  JDOUBLE_INFINITY_NEGATIVE,
  JDOUBLE_INFINITY_POSITIVE,
  JDOUBLE_NOT_A_NUMBER, JDOUBLE_ZERO_NEGATIVE,
  JDOUBLE_ZERO_POSITIVE,
} from "./JDouble.js";
import JFloat, {
  JFLOAT_INFINITY_NEGATIVE,
  JFLOAT_INFINITY_POSITIVE,
  JFLOAT_NOT_A_NUMBER, JFLOAT_ZERO_NEGATIVE,
  JFLOAT_ZERO_POSITIVE,
} from "./JFloat.js";

const MIN_DECIMAL_EXPONENT = new JInt(-324);
const BIG_DECIMAL_EXPONENT = new JInt(324); // i.e. abs(MIN_DECIMAL_EXPONENT)

const INFINITY_REP = "Infinity";
const INFINITY_LENGTH = new JInt(INFINITY_REP.length);
const NAN_REP = "NaN";
const NAN_LENGTH = new JInt(NAN_REP.length);

interface ASCIIToBinaryConverter {

  doubleValue(): JDouble;

  floatValue(): JFloat;
}

class ASCIIToBinaryBuffer implements ASCIIToBinaryConverter {
  private readonly isNegative: boolean;
  private readonly decExponent: JInt;
  private readonly digits: string[];
  private readonly nDigits: JInt;

  constructor(isNegative: boolean, decExponent: JInt, digits: string[], nDigits: JInt) {
    this.isNegative = isNegative;
    this.decExponent = decExponent;
    this.digits = digits;
    this.nDigits = nDigits;
  }

  public doubleValue(): JDouble {
    // TODO
  }

  public floatValue(): JFloat {
    // TODO
  }
}

const createStaticConverter = (double: JDouble, float: JFloat) => {
  return {
    doubleValue: () => double,
    floatValue: () => float,
  } as ASCIIToBinaryConverter;
};

const A2BC_POSITIVE_INFINITY = createStaticConverter(JDOUBLE_INFINITY_POSITIVE, JFLOAT_INFINITY_POSITIVE);
const A2BC_NEGATIVE_INFINITY = createStaticConverter(JDOUBLE_INFINITY_NEGATIVE, JFLOAT_INFINITY_NEGATIVE);
const A2BC_NOT_A_NUMBER = createStaticConverter(JDOUBLE_NOT_A_NUMBER, JFLOAT_NOT_A_NUMBER);
const A2BC_POSITIVE_ZERO = createStaticConverter(JDOUBLE_ZERO_POSITIVE, JFLOAT_ZERO_POSITIVE);
const A2BC_NEGATIVE_ZERO = createStaticConverter(JDOUBLE_ZERO_NEGATIVE, JFLOAT_ZERO_NEGATIVE);

const readJavaFormatString = (input: string): ASCIIToBinaryConverter => {
  let isNegative = false;
  let signSeen = false;
  let decExp: JInt;
  let c: string;

  parseNumber:{
    input = input.trim(); // don't fool around with white space.
    // throws NullPointerException if null
    const len = new JInt(input.length);
    if (len.equal(JINT_ZERO)) {
      throw new Error("empty String");
    }
    let i = JINT_ZERO;
    switch (input.charAt(i.asJsNumber())) {
      case "-":
        isNegative = true;
        // fallthrough
      case "+":
        i = i.plus(JINT_ONE_POSITIVE).intValue();
        signSeen = true;
    }
    c = input.charAt(i.asJsNumber());
    if (c === "N") { // check for NaN
      if (len.minus(i).equal(NAN_LENGTH) && new JInt(input.indexOf(NAN_REP, i.asJsNumber())).equal(i)) {
        return A2BC_NOT_A_NUMBER;
      }
      // something went wrong, throw exception
      break parseNumber;
    } else if (c === "I") { // check for Infinity strings
      if (len.minus(i).equal(INFINITY_LENGTH) && new JInt(input.indexOf(INFINITY_REP, i.asJsNumber())).equal(i)) {
        return isNegative ? A2BC_NEGATIVE_INFINITY : A2BC_POSITIVE_INFINITY;
      }
      // something went wrong, throw exception
      break parseNumber;
    } else if (c === "0") { // check for hexadecimal floating-point number
      if (len.greaterThan(i.plus(JINT_ONE_POSITIVE))) {
        const ch = input.charAt(i.plus(JINT_ONE_POSITIVE).asJsNumber());
        if (ch === "x" || ch === "X") { // possible hex string
          return parseHexString(input);
        }
      }
    } // look for and process decimal floating-point string

    const digits = new Array<string>(len.asJsNumber());
    let decSeen = false;
    let nDigits = JINT_ZERO;
    let decPt = JINT_ZERO;
    let nLeadZero = JINT_ZERO;
    let nTrailZero = JINT_ZERO;

    skipLeadingZerosLoop:
        while (i.lessThan(len)) {
          c = input.charAt(i.asJsNumber());
          if (c === "0") {
            nLeadZero = nLeadZero.plus(JINT_ONE_POSITIVE).intValue();
          } else if (c === ".") {
            if (decSeen) {
              // already saw one ., this is the 2nd.
              throw new Error("multiple points");
            }
            decPt = i;
            if (signSeen) {
              decPt = decPt.minus(JINT_ONE_POSITIVE).intValue();
            }
            decSeen = true;
          } else {
            break skipLeadingZerosLoop;
          }
          i = i.plus(JINT_ONE_POSITIVE).intValue();
        }
    digitLoop:
        while (i.lessThan(len)) {
          c = input.charAt(i.asJsNumber());
          if (c >= "1" && c <= "9") {
            digits[nDigits.asJsNumber()] = c;
            nDigits = nDigits.plus(JINT_ONE_POSITIVE).intValue();
            nTrailZero = JINT_ZERO;
          } else if (c === "0") {
            digits[nDigits.asJsNumber()] = c;
            nDigits = nDigits.plus(JINT_ONE_POSITIVE).intValue();
            nTrailZero = nTrailZero.plus(JINT_ONE_POSITIVE).intValue();
          } else if (c === ".") {
            if (decSeen) {
              // already saw one ., this is the 2nd.
              throw new Error("multiple points");
            }
            decPt = i;
            if (signSeen) {
              decPt = decPt.minus(JINT_ONE_POSITIVE).intValue();
            }
            decSeen = true;
          } else {
            break digitLoop;
          }
          i = i.plus(JINT_ONE_POSITIVE).intValue();
        }
    nDigits = nDigits.minus(nTrailZero).intValue();
    // At this point, we've scanned all the digits and decimal
    // point we're going to see. Trim off leading and trailing
    // zeros, which will just confuse us later, and adjust
    // our initial decimal exponent accordingly.
    // To review:
    // we have seen i total characters.
    // nLeadZero of them were zeros before any other digits.
    // nTrailZero of them were zeros after any other digits.
    // if ( decSeen ), then a . was seen after decPt characters
    // ( including leading zeros which have been discarded )
    // nDigits characters were neither lead nor trailing
    // zeros, nor point
    //
    // special hack: if we saw no non-zero digits, then the answer is zero!
    // Unfortunately, we feel honor-bound to keep parsing!
    const isZero = nDigits.equal(JINT_ZERO);
    if (isZero && nLeadZero.equal(JINT_ZERO)) {
      // we saw NO DIGITS AT ALL,
      // not even a crummy 0!
      // this is not allowed.
      break parseNumber; // go throw exception
    }
    // Our initial exponent is decPt, adjusted by the number of
    // discarded zeros. Or, if there was no decPt,
    // then its just nDigits adjusted by discarded trailing zeros.
    if (decSeen) {
      decExp = decPt.minus(nLeadZero).intValue();
    } else {
      decExp = nDigits.plus(nTrailZero).intValue();
    }

    // Look for 'e' or 'E' and an optionally signed integer.
    if (i.lessThan(len) && ((c = input.charAt(i.asJsNumber())) === "e" || c === "E")) {
      let expSign = JINT_ONE_POSITIVE;
      let expVal = JINT_ZERO;
      const reallyBig = JINT_MAX_VALUE.divide(JINT_TEN_POSITIVE);
      let expOverflow = false;
      i = i.plus(JINT_ONE_POSITIVE).intValue();
      switch (input.charAt(i.asJsNumber())) {
        case "-":
          expSign = JINT_ONE_NEGATIVE;
          // fallthrough
        case "+":
          i = i.plus(JINT_ONE_POSITIVE).intValue();
      }
      let expAt = i;
      expLoop:
          while (i.lessThan(len)) {
            if (expVal.greaterThanEqual(reallyBig)) {
              // the next character will cause integer overflow
              expOverflow = true;
            }
            c = input.charAt(i.asJsNumber());
            i = i.plus(JINT_ONE_POSITIVE).intValue();
            if (c >= "0" && c <= "9") {
              expVal = expVal.multiply(JINT_TEN_POSITIVE).plus(new JInt(parseInt(c, 10))).intValue();
            } else {
              i = i.minus(JINT_ONE_POSITIVE).intValue(); // back up
              break expLoop; // stop parsing exponent
            }
          }
      const expLimit = BIG_DECIMAL_EXPONENT.plus(nDigits).plus(nTrailZero).intValue();
      if (expOverflow || (expVal.greaterThan(expLimit))) {
        // There is still a chance that the exponent will be safe to use:
        // if it would eventually decrease due to a negative decExp,
        // and that number is below the limit. We check for that here
        if (!expOverflow && (expSign.equal(JINT_ONE_POSITIVE) && decExp.lessThan(JINT_ZERO))
            && expVal.plus(decExp).lessThan(expLimit)) {
          // cannot overflow: adding a positive and a negative number
          decExp = decExp.plus(expVal).intValue();
        } else {
          // The intent here is to end up with
          // infinity or zero, as appropriate.
          // The reason for yielding such a small decExponent,
          // rather than something intuitive such as
          // expSign*Integer.MAX_VALUE, is that this value
          // is subject to further manipulation in
          // doubleValue() and floatValue(), and I don't want
          // it to be able to cause overflow there!
          // (The only way we can get into trouble here is for
          // really outrageous nDigits+nTrailZero, such as 2 billion.)
          decExp = expSign.multiply(expLimit).intValue();
        }
      } else {
        // this should not overflow, since we tested
        // for expVal > (MAX+N), where N >= abs(decExp)
        decExp = decExp.plus(expSign.multiply(expVal)).intValue();
      }
      // if we saw something not a digit ( or end of string )
      // after the [Ee][+-], without seeing any digits at all
      // this is certainly an error. If we saw some digits,
      // but then some trailing garbage, that might be ok.
      // so we just fall through in that case.
      // HUMBUG
      if (i.equal(expAt)) {
        break parseNumber; // certainly bad
      }
    }
    // We parsed everything we could.
    // If there are leftovers, then this is not good input!
    if (i.lessThan(len) &&
        (!i.equal(len.minus(JINT_ONE_POSITIVE)) ||
            (input.charAt(i.asJsNumber()) !== "f" &&
                input.charAt(i.asJsNumber()) !== "F" &&
                input.charAt(i.asJsNumber()) !== "d" &&
                input.charAt(i.asJsNumber()) !== "D"))) {
      break parseNumber; // go throw exception
    }
    if (isZero) {
      return isNegative ? A2BC_NEGATIVE_ZERO : A2BC_POSITIVE_ZERO;
    }
    return new ASCIIToBinaryBuffer(isNegative, decExp, digits, nDigits);
  }
  throw new Error(`For input string: "${input}"`);
};
