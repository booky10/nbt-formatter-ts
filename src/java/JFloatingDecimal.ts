import JInt, {JINT_MAX_VALUE, JINT_ONE_NEGATIVE, JINT_ONE_POSITIVE, JINT_TEN_POSITIVE, JINT_ZERO} from "./JInt.js";
import JDouble, {
  JDOUBLE_EXP_BIAS, JDOUBLE_EXP_BIT_MASK,
  JDOUBLE_INFINITY_NEGATIVE,
  JDOUBLE_INFINITY_POSITIVE, JDOUBLE_MAX_EXPONENT, JDOUBLE_MIN_EXPONENT, JDOUBLE_MIN_SUB_EXPONENT,
  JDOUBLE_NOT_A_NUMBER, JDOUBLE_PRECISION, JDOUBLE_SIGN_BIT_MASK, JDOUBLE_SIGNIF_BIT_MASK, JDOUBLE_ZERO_NEGATIVE,
  JDOUBLE_ZERO_POSITIVE,
} from "./JDouble.js";
import JFloat, {
  JFLOAT_EXP_BIAS, JFLOAT_EXP_BIT_MASK,
  JFLOAT_INFINITY_NEGATIVE,
  JFLOAT_INFINITY_POSITIVE, JFLOAT_MAX_EXPONENT, JFLOAT_MIN_EXPONENT, JFLOAT_MIN_SUB_EXPONENT,
  JFLOAT_NOT_A_NUMBER, JFLOAT_PRECISION, JFLOAT_SIGN_BIT_MASK, JFLOAT_SIZE, JFLOAT_ZERO_NEGATIVE,
  JFLOAT_ZERO_POSITIVE,
} from "./JFloat.js";
import JLong, {JLONG_ONE_NEGATIVE, JLONG_ONE_POSITIVE, JLONG_ZERO} from "./JLong.js";
import {assert} from "../common/util.js";

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


const HEX_FLOAT_PATTERN = RegExp(
    //1          234                   56                7                   8      9
    "([-+])?0[xX]((([0-9a-fA-F]+)\\.?)|(([0-9a-fA-F]*)\\.([0-9a-fA-F]+)))[pP]([-+])?([0-9]+)[fFdD]?",
);

const parseHexString = (input: string): ASCIIToBinaryConverter => {
  // verify string is a member of the hexadecimal floating-point string language
  const m = HEX_FLOAT_PATTERN.exec(input);
  if (!m) {
    // input does not match pattern
    throw new Error(`For input string: "${input}"`);
  } else { // valid input
    // We must isolate the sign, significand, and exponent
    // fields.  The sign value is straightforward.  Since
    // floating-point numbers are stored with a normalized
    // representation, the significand and exponent are
    // interrelated.
    //
    // After extracting the sign, we normalized the
    // significand as a hexadecimal value, calculating an
    // exponent adjust for any shifts made during
    // normalization.  If the significand is zero, the
    // exponent doesn't need to be examined since the output
    // will be zero.
    //
    // Next the exponent in the input string is extracted.
    // Afterwards, the significand is normalized as a *binary*
    // value and the input value's normalized exponent can be
    // computed.  The significand bits are copied into a
    // double significand; if the string has more logical bits
    // than can fit in a double, the extra bits affect the
    // round and sticky bits which are used to round the final
    // value.
    //
    //  Extract significand sign
    const group1 = m[1];
    const isNegative = group1 === "-";

    //  Extract Significand magnitude
    //
    // Based on the form of the significand, calculate how the
    // binary exponent needs to be adjusted to create a
    // normalized//hexadecimal* floating-point number; that
    // is, a number where there is one nonzero hex digit to
    // the left of the (hexa)decimal point.  Since we are
    // adjusting a binary, not hexadecimal exponent, the
    // exponent is adjusted by a multiple of 4.
    //
    // There are a number of significand scenarios to consider;
    // letters are used in indicate nonzero digits:
    //
    // 1. 000xxxx       =>      x.xxx   normalized
    //    increase exponent by (number of x's - 1)*4
    //
    // 2. 000xxx.yyyy =>        x.xxyyyy        normalized
    //    increase exponent by (number of x's - 1)*4
    //
    // 3. .000yyy  =>   y.yy    normalized
    //    decrease exponent by (number of zeros + 1)*4
    //
    // 4. 000.00000yyy => y.yy normalized
    //    decrease exponent by (number of zeros to right of point + 1)*4
    //
    // If the significand is exactly zero, return a properly
    // signed zero.

    let significandString: string;
    let signifLength: JInt;
    let exponentAdjust: JInt;
    {
      let leftDigits = JINT_ZERO; // number of meaningful digits to
      // left of "decimal" point
      // (leading zeros stripped)
      let rightDigits = JINT_ZERO; // number of digits to right of
      // "decimal" point; leading zeros
      // must always be accounted for
      //
      // The significand is made up of either
      //
      // 1. group 4 entirely (integer portion only)
      //
      // OR
      //
      // 2. the fractional portion from group 7 plus any
      // (optional) integer portions from group 6.
      const group4 = m[4];
      if (group4 !== undefined && group4 !== null) { /// Integer-only significand
        // leading zeros never matter on the integer portion
        significandString = stripLeadingZeros(group4);
        leftDigits = new JInt(significandString.length);
      } else {
        // Group 6 is the optional integer; leading zeros
        // never matter on the integer portion
        const group6 = stripLeadingZeros(m[6] ?? "");
        leftDigits = new JInt(group6.length);

        // fraction
        const group7 = m[7] ?? "";
        rightDigits = new JInt(group7.length);

        // turn "integer.fraction" into "integer"+"fraction"
        significandString = group6 + group7;
      }

      significandString = stripLeadingZeros(significandString);
      signifLength = new JInt(significandString.length);

      // adjust exponent as described above
      if (leftDigits.greaterThanEqual(JINT_ONE_POSITIVE)) { // cases 1 and 2
        exponentAdjust = new JInt(4).multiply(leftDigits.minus(JINT_ONE_POSITIVE)).intValue();
      } else { // cases 3 and 4
        exponentAdjust = new JInt(-4).multiply(rightDigits.minus(signifLength).plus(JINT_ONE_POSITIVE)).intValue();
      }

      // if the significand is zero, the exponent doesn't matter; return a properly signed zero
      if (signifLength.equal(JINT_ZERO)) { // only zeros in input
        return isNegative ? A2BC_NEGATIVE_ZERO : A2BC_POSITIVE_ZERO;
      }
    }

    //  Extract Exponent
    //
    // Use an int to read in the exponent value; this should
    // provide more than sufficient range for non-contrived
    // inputs.  If reading the exponent in as an int does
    // overflow, examine the sign of the exponent and
    // significand to determine what to do.
    const group8 = m[8];
    const positiveExponent = (group8 === undefined || group8 === null) || group8 === "+";

    let unsignedRawExponent: JLong;
    try {
      unsignedRawExponent = JInt.parseInt(m[9] ?? "").longValue();
    } catch (error) {
      // At this point, we know the exponent is
      // syntactically well-formed as a sequence of
      // digits.  Therefore, if an NumberFormatException
      // is thrown, it must be due to overflowing int's
      // range.  Also, at this point, we have already
      // checked for a zero significand.  Thus the signs
      // of the exponent and significand determine the
      // final result:
      //
      //                      significand
      //                      +               -
      // exponent     +       +infinity       -infinity
      //              -       +0.0            -0.0
      return isNegative ?
          (positiveExponent ? A2BC_NEGATIVE_INFINITY : A2BC_NEGATIVE_ZERO)
          : (positiveExponent ? A2BC_POSITIVE_INFINITY : A2BC_POSITIVE_ZERO);
    }

    const rawExponent =
        (positiveExponent ? JLONG_ONE_POSITIVE : JLONG_ONE_NEGATIVE) // exponent sign
            .multiply(unsignedRawExponent).longValue(); // exponent magnitude

    // calculate partially adjusted exponent
    let exponent = rawExponent.plus(exponentAdjust).longValue();

    // Starting copying non-zero bits into proper position in
    // a long; copy explicit bit too; this will be masked
    // later for normal values.

    let round = false;
    let sticky = false;
    let nextShift: JInt;
    let significand = JLONG_ZERO;
    // First iteration is different, since we only copy
    // from the leading significand bit; one more exponent
    // adjust will be needed...

    // IMPORTANT: make leadingDigit a long to avoid
    // surprising shift semantics!
    const leadingDigit = getHexDigit(significandString, JINT_ZERO).longValue();

    // Left shift the leading digit (53 - (bit position of
    // leading 1 in digit)); this sets the top bit of the
    // significand to 1.  The nextShift value is adjusted
    // to take into account the number of bit positions of
    // the leadingDigit actually used.  Finally, the
    // exponent is adjusted to normalize the significand
    // as a binary value, not just a hex value.
    if (leadingDigit.equal(JLONG_ONE_POSITIVE)) {
      significand = significand.or(leadingDigit.shiftLeft(new JLong(52))).longValue();
      nextShift = new JInt(52 - 4);
      // exponent += 0
    } else if (leadingDigit.lessThanEqual(new JLong(3))) { // [2, 3]
      significand = significand.or(leadingDigit.shiftLeft(new JLong(51))).longValue();
      nextShift = new JInt(52 - 5);
      exponent = exponent.plus(JLONG_ONE_POSITIVE).longValue();
    } else if (leadingDigit.lessThanEqual(new JLong(7))) { // [4, 7]
      significand = significand.or(leadingDigit.shiftLeft(new JLong(50))).longValue();
      nextShift = new JInt(52 - 6);
      exponent = exponent.plus(new JLong(2)).longValue();
    } else if (leadingDigit.lessThanEqual(new JLong(15))) { // [8, f]
      significand = significand.or(leadingDigit.shiftLeft(new JLong(49))).longValue();
      nextShift = new JInt(52 - 7);
      exponent = exponent.plus(new JLong(3)).longValue();
    } else {
      throw new Error("Result from digit conversion too large!");
    }
    // The preceding if-else could be replaced by a single
    // code block based on the high-order bit set in
    // leadingDigit.  Given leadingOnePosition,

    // significand |= leadingDigit << (SIGNIFICAND_WIDTH - leadingOnePosition);
    // nextShift = 52 - (3 + leadingOnePosition);
    // exponent += (leadingOnePosition-1);

    //
    // Now the exponent variable is equal to the normalized
    // binary exponent.  Code below will make representation
    // adjustments if the exponent is incremented after
    // rounding (includes overflows to infinity) or if the
    // result is subnormal.
    //

    // Copy digit into significand until the significand can't
    // hold another full hex digit or there are no more input
    // hex digits.
    let i = JINT_ZERO;
    for (i = JINT_ONE_POSITIVE;
         i.lessThan(signifLength) && nextShift.greaterThanEqual(JINT_ZERO);
         i = i.plus(JINT_ONE_POSITIVE).intValue()) {
      let currentDigit = getHexDigit(significandString, i).longValue();
      significand = significand.or(currentDigit.shiftLeft(nextShift)).longValue();
      nextShift = nextShift.minus(new JInt(4)).intValue();
    }

    // After the above loop, the bulk of the string is copied.
    // Now, we must copy any partial hex digits into the
    // significand AND compute the round bit and start computing
    // sticky bit.

    if (i.lessThan(signifLength)) { // at least one hex input digit exists
      let currentDigit = getHexDigit(significandString, i).longValue();

      // from nextShift, figure out how many bits need
      // to be copied, if any;
      // nextShift must be negative
      if (nextShift.equal(JINT_ONE_NEGATIVE)) {
        // three bits need to be copied in; can set round bit
        significand = significand.or(currentDigit.and(new JLong(0xE)).shiftRight(JLONG_ONE_POSITIVE)).longValue();
        round = !currentDigit.and(JLONG_ONE_POSITIVE).equal(JLONG_ZERO);
      } else if (nextShift.equal(new JInt(-2))) {
        // two bits need to be copied in; can
        // set round and start sticky
        significand = significand.or(currentDigit.and(new JLong(0xC)).shiftRight(new JLong(2))).longValue();
        round = !currentDigit.and(new JLong(2)).equal(JLONG_ZERO);
        sticky = !currentDigit.and(JLONG_ONE_POSITIVE).equal(JLONG_ZERO);
      } else if (nextShift.equal(new JInt(-3))) {
        // one bit needs to be copied in
        significand = significand.or(currentDigit.and(new JLong(0x8)).shiftRight(new JLong(3))).longValue();
        // Now set round and start sticky, if possible
        round = !currentDigit.and(new JLong(4)).equal(JLONG_ZERO);
        sticky = !currentDigit.and(new JLong(3)).equal(JLONG_ZERO);
      } else if (nextShift.equal(new JInt(-3))) {
        // all bits copied into significand; set
        // round and start sticky
        round = !currentDigit.and(new JLong(8)).equal(JLONG_ZERO); // is top bit set?
        // nonzeros in three low order bits?
        sticky = !currentDigit.and(new JLong(7)).equal(JLONG_ZERO);
      } else {
        throw new Error("Unexpected shift distance remainder.");
      }

      // Round is set; sticky might be set.

      // For the sticky bit, it suffices to check the
      // current digit and test for any nonzero digits in
      // the remaining unprocessed input.
      i = i.plus(JINT_ONE_POSITIVE).intValue();
      while (i.lessThan(signifLength) && !sticky) {
        currentDigit = getHexDigit(significandString, i).longValue();
        sticky = sticky || !currentDigit.equal(JLONG_ZERO);
        i = i.plus(JINT_ONE_POSITIVE).intValue();
      }
    }
    // else all of string was seen, round and sticky are
    // correct as false.

    // Float calculations
    let floatBits = isNegative ? JFLOAT_SIGN_BIT_MASK : JINT_ZERO;
    if (exponent.greaterThanEqual(JFLOAT_MIN_EXPONENT)) {
      if (exponent.greaterThan(JFLOAT_MAX_EXPONENT)) {
        // Float.POSITIVE_INFINITY
        floatBits = floatBits.or(JFLOAT_EXP_BIT_MASK).intValue();
      } else {
        const threshShift = JDOUBLE_PRECISION.minus(JFLOAT_PRECISION).minus(JINT_ONE_POSITIVE).intValue();
        const floatSticky = round || sticky || !significand.and(JLONG_ONE_POSITIVE.shiftLeft(threshShift).minus(JLONG_ONE_POSITIVE)).equal(JLONG_ZERO);
        let iValue = significand.unsignedShiftRight(threshShift).intValue();
        if (floatSticky || !iValue.and(new JInt(3)).equal(new JInt(1))) {
          iValue = iValue.plus(JINT_ONE_POSITIVE).intValue();
        }
        floatBits = floatBits.or(
            exponent.intValue().plus(JFLOAT_EXP_BIAS.minus(JINT_ONE_POSITIVE))
                .shiftLeft(JFLOAT_PRECISION.minus(JINT_ONE_POSITIVE))
                .plus(iValue.shiftRight(JINT_ONE_POSITIVE)),
        ).intValue();
      }
    } else {
      if (exponent.lessThan(JFLOAT_MIN_SUB_EXPONENT.minus(JINT_ONE_POSITIVE))) {
        // 0
      } else {
        // exponent == -127 ==> threshShift = 53 - 2 + (-149) - (-127) = 53 - 24
        const threshShift = JDOUBLE_PRECISION.minus(new JInt(2)).plus(JFLOAT_MIN_SUB_EXPONENT).minus(exponent).intValue();
        assert(threshShift.greaterThanEqual(JDOUBLE_PRECISION.minus(JFLOAT_PRECISION)));
        assert(threshShift.lessThan(JDOUBLE_PRECISION));
        const floatSticky = round || sticky || !significand.and(JLONG_ONE_POSITIVE.shiftLeft(threshShift)
            .minus(JLONG_ONE_POSITIVE)).equal(JLONG_ZERO);
        let iValue = significand.unsignedShiftRight(threshShift).intValue();
        if (floatSticky || !iValue.and(new JInt(3)).equal(JINT_ONE_POSITIVE)) {
          iValue = iValue.plus(JINT_ONE_POSITIVE).intValue();
        }
        floatBits = floatBits.or(iValue.shiftRight(JINT_ONE_POSITIVE)).intValue();
      }
    }
    const fValue = JFloat.fromRawIntBits(floatBits);

    // check for overflow and update exponent accordingly
    if (exponent > JDOUBLE_MAX_EXPONENT) { // infinite result
      // overflow to properly signed infinity
      return isNegative ? A2BC_NEGATIVE_INFINITY : A2BC_POSITIVE_INFINITY;
    } else { // finite return value
      if (exponent.lessThanEqual(JDOUBLE_MAX_EXPONENT) && // (usually) normal result
          exponent.greaterThanEqual(JDOUBLE_MIN_EXPONENT)) {

        // The result returned in this block cannot be a
        // zero or subnormal; however after the
        // significand is adjusted from rounding, we could
        // still overflow in infinity.

        // AND exponent bits into significand; if the
        // significand is incremented and overflows from
        // rounding, this combination will update the
        // exponent correctly, even in the case of
        // Double.MAX_VALUE overflowing to infinity.

        significand = exponent
            .plus(JDOUBLE_EXP_BIAS)
            .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE_POSITIVE))
            .and(JDOUBLE_EXP_BIT_MASK)
            .or(JDOUBLE_SIGNIF_BIT_MASK.and(significand))
            .longValue();
      } else { // subnormal or zero
        // (exponent < Double.MIN_EXPONENT)

        if (exponent.lessThan(JDOUBLE_MIN_SUB_EXPONENT.minus(JINT_ONE_POSITIVE))) {
          // No way to round back to nonzero value
          // regardless of significand if the exponent is less than -1075
          return isNegative ? A2BC_NEGATIVE_ZERO : A2BC_POSITIVE_ZERO;
        } else { // -1075 <= exponent <= MIN_EXPONENT -1 = -1023
          // Find bit position to round to; recompute
          // round and sticky bits, and shift
          // significand right appropriately.

          sticky = sticky || round;
          round = false;

          // Number of bits of significand to preserve is
          // exponent - abs_min_exp +1
          // check:
          // -1075 +1074 + 1 = 0
          // -1023 +1074 + 1 = 52

          const bitsDiscarded = new JInt(53)
              .minus(exponent.intValue().minus(JDOUBLE_MIN_SUB_EXPONENT).plus(JINT_ONE_POSITIVE)).intValue();
          assert(bitsDiscarded.greaterThanEqual(JINT_ONE_POSITIVE) && bitsDiscarded.lessThanEqual(new JInt(53)));

          // What to do here:
          // First, isolate the new round bit
          round = !significand.and(JLONG_ONE_POSITIVE.shiftLeft(bitsDiscarded.minus(JINT_ONE_POSITIVE))).equal(JLONG_ZERO);
          if (bitsDiscarded.greaterThan(JINT_ONE_POSITIVE)) {
            // create mask to update sticky bits; low
            // order bitsDiscarded bits should be 1
            const mask = JLONG_ZERO.not().shiftLeft(bitsDiscarded.minus(JINT_ONE_POSITIVE)).not().longValue();
            sticky = sticky || !significand.and(mask).equal(JLONG_ZERO);
          }

          // Now, discard the bits
          significand = significand.shiftRight(bitsDiscarded).longValue();

          significand = JDOUBLE_MIN_EXPONENT.minus(JINT_ONE_POSITIVE).longValue() // subnorm exp.
              .plus(JDOUBLE_EXP_BIAS.longValue())
              .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE_POSITIVE))
              .and(JDOUBLE_EXP_BIT_MASK)
              .or(JDOUBLE_SIGNIF_BIT_MASK.and(significand))
              .longValue();
        }
      }

      // The significand variable now contains the currently
      // appropriate exponent bits too.

      //
      // Determine if significand should be incremented;
      // making this determination depends on the least
      // significant bit and the round and sticky bits.
      //
      // Round to nearest even rounding table, adapted from
      // table 4.7 in "Computer Arithmetic" by IsraelKoren.
      // The digit to the left of the "decimal" point is the
      // least significant bit, the digits to the right of
      // the point are the round and sticky bits
      //
      // Number       Round(x)
      // x0.00        x0.
      // x0.01        x0.
      // x0.10        x0.
      // x0.11        x1. = x0. +1
      // x1.00        x1.
      // x1.01        x1.
      // x1.10        x1. + 1
      // x1.11        x1. + 1
      const leastZero = significand.and(JLONG_ONE_POSITIVE).equal(JLONG_ZERO);
      if ((leastZero && round && sticky) || (!leastZero && round)) {
        significand = significand.plus(JLONG_ONE_POSITIVE).longValue();
      }

      const value = isNegative
          ? JDouble.fromRawLongBits(significand.or(JDOUBLE_SIGN_BIT_MASK))
          : JDouble.fromRawLongBits(significand);

      return createStaticConverter(value, fValue);
    }
  }
};

const stripLeadingZeros = (s: string) => {
  if (s.length && s[0] === "0") {
    for (let i = 1; i < s.length; i++) {
      if (s[i] !== "0") {
        return s.substring(i);
      }
    }
    return "";
  }
  return s;
};

const getHexDigit = (s: string, position: JInt) => {
  const value = new JInt(parseInt(s[position.asJsNumber()], 16));
  if (value.lessThanEqual(JINT_ONE_NEGATIVE) || value.greaterThanEqual(new JInt(16))) {
    throw new Error(`Unexpected failure of digit conversion of ${s[position.asJsNumber()]}`);
  }
  return value;
};
