// noinspection UnnecessaryLabelOnBreakStatementJS

import JInt, {
  JINT_MAX_VALUE,
  JINT_ONE_NEGATIVE,
  JINT_ONE,
  JINT_TEN,
  JINT_ZERO,
  JINT_FOUR,
  JINT_SIXTEEN, JINT_TWO,
} from "./JInt.js";
import JDouble, {
  JDOUBLE_EXP_BIAS,
  JDOUBLE_EXP_BIT_MASK,
  JDOUBLE_INFINITY_NEGATIVE,
  JDOUBLE_INFINITY,
  JDOUBLE_MAX_EXPONENT, JDOUBLE_MAX_VALUE,
  JDOUBLE_MIN_EXPONENT,
  JDOUBLE_MIN_SUB_EXPONENT, JDOUBLE_MIN_VALUE,
  JDOUBLE_NOT_A_NUMBER,
  JDOUBLE_ONE_NEGATIVE, JDOUBLE_ONE,
  JDOUBLE_PRECISION,
  JDOUBLE_SIGN_BIT_MASK,
  JDOUBLE_SIGNIF_BIT_MASK, JDOUBLE_TWO_POSITIVE,
  JDOUBLE_ZERO_NEGATIVE,
  JDOUBLE_ZERO,
} from "./JDouble.js";
import JFloat, {
  JFLOAT_EXP_BIAS, JFLOAT_EXP_BIT_MASK,
  JFLOAT_INFINITY_NEGATIVE,
  JFLOAT_INFINITY, JFLOAT_MAX_EXPONENT, JFLOAT_MIN_EXPONENT, JFLOAT_MIN_SUB_EXPONENT,
  JFLOAT_NOT_A_NUMBER, JFLOAT_PRECISION, JFLOAT_SIGN_BIT_MASK, JFLOAT_SIZE, JFLOAT_ZERO_NEGATIVE,
  JFLOAT_ZERO, JFLOAT_ONE_NEGATIVE, JFLOAT_MIN_VALUE, JFLOAT_MAX_VALUE, JFLOAT_SIGNIF_BIT_MASK, JFLOAT_ONE,
} from "./JFloat.js";
import JLong, {JLONG_ONE_NEGATIVE, JLONG_ONE, JLONG_ZERO, JLONG_TEN} from "./JLong.js";
import {assert} from "../common/util.js";
import JMath from "./JMath.js";

const EXP_SHIFT = JDOUBLE_PRECISION.minus(JINT_ONE).intValue();
const FRACT_HOB = JLONG_ONE.shiftLeft(EXP_SHIFT).longValue(); // assumed High-Order bit
const EXP_ONE = JDOUBLE_EXP_BIAS.longValue().shiftLeft(EXP_SHIFT).longValue(); // exponent of 1.0
const MAX_SMALL_BIN_EXP = new JInt(62);
const MIN_SMALL_BIN_EXP = new JInt(63).divide(new JInt(3)).multiply(JINT_ONE_NEGATIVE).intValue();
const MAX_DECIMAL_DIGITS = new JInt(15);
const MAX_DECIMAL_EXPONENT = new JInt(308);
const MIN_DECIMAL_EXPONENT = new JInt(-324);
const BIG_DECIMAL_EXPONENT = new JInt(324); // i.e. abs(MIN_DECIMAL_EXPONENT)
const MAX_NDIGITS = new JInt(1100);

const SINGLE_EXP_SHIFT = JFLOAT_PRECISION.minus(JINT_ONE).intValue();
const SINGLE_FRACT_HOB = JINT_ONE.shiftLeft(SINGLE_EXP_SHIFT).intValue();
const SINGLE_MAX_DECIMAL_DIGITS = new JInt(7);
const SINGLE_MAX_DECIMAL_EXPONENT = new JInt(38);
const SINGLE_MIN_DECIMAL_EXPONENT = new JInt(-45);
const SINGLE_MAX_NDIGITS = new JInt(200);

const INT_DECIMAL_DIGITS = new JInt(9);

const INFINITY_REP = "Infinity";
const INFINITY_LENGTH = new JInt(INFINITY_REP.length);
const NAN_REP = "NaN";
const NAN_LENGTH = new JInt(NAN_REP.length);

const SMALL_10_POW: JDouble[] = [
  JDouble.fromRawLongBits(0x3FF0000000000000n), // 1.0E0
  JDouble.fromRawLongBits(0x4024000000000000n), // 1.0E1
  JDouble.fromRawLongBits(0x4059000000000000n), // 1.0E2
  JDouble.fromRawLongBits(0x408F400000000000n), // 1.0E3
  JDouble.fromRawLongBits(0x40C3880000000000n), // 1.0E4
  JDouble.fromRawLongBits(0x40F86A0000000000n), // 1.0E5
  JDouble.fromRawLongBits(0x412E848000000000n), // 1.0E6
  JDouble.fromRawLongBits(0x416312D000000000n), // 1.0E7
  JDouble.fromRawLongBits(0x4197D78400000000n), // 1.0E8
  JDouble.fromRawLongBits(0x41CDCD6500000000n), // 1.0E9
  JDouble.fromRawLongBits(0x4202A05F20000000n), // 1.0E10
  JDouble.fromRawLongBits(0x42374876E8000000n), // 1.0E11
  JDouble.fromRawLongBits(0x426D1A94A2000000n), // 1.0E12
  JDouble.fromRawLongBits(0x42A2309CE5400000n), // 1.0E13
  JDouble.fromRawLongBits(0x42D6BCC41E900000n), // 1.0E14
  JDouble.fromRawLongBits(0x430C6BF526340000n), // 1.0E15
  JDouble.fromRawLongBits(0x4341C37937E08000n), // 1.0E16
  JDouble.fromRawLongBits(0x4376345785D8A000n), // 1.0E17
  JDouble.fromRawLongBits(0x43ABC16D674EC800n), // 1.0E18
  JDouble.fromRawLongBits(0x43E158E460913D00n), // 1.0E19
  JDouble.fromRawLongBits(0x4415AF1D78B58C40n), // 1.0E20
  JDouble.fromRawLongBits(0x444B1AE4D6E2EF50n), // 1.0E21
  JDouble.fromRawLongBits(0x4480F0CF064DD592n), // 1.0E22
];
const SINGLE_SMALL_10_POW: JFloat[] = [
  JFloat.fromRawIntBits(0x3F800000n), // 1.0E0
  JFloat.fromRawIntBits(0x41200000n), // 1.0E1
  JFloat.fromRawIntBits(0x42C80000n), // 1.0E2
  JFloat.fromRawIntBits(0x447A0000n), // 1.0E3
  JFloat.fromRawIntBits(0x461C4000n), // 1.0E4
  JFloat.fromRawIntBits(0x47C35000n), // 1.0E5
  JFloat.fromRawIntBits(0x49742400n), // 1.0E6
  JFloat.fromRawIntBits(0x4B189680n), // 1.0E7
  JFloat.fromRawIntBits(0x4CBEBC20n), // 1.0E8
  JFloat.fromRawIntBits(0x4E6E6B28n), // 1.0E9
  JFloat.fromRawIntBits(0x501502F9n), // 1.0E10
];

const BIG_10_POW: JDouble[] = [
  JDouble.fromRawLongBits(0x4341C37937E08000n), // 1.0E16
  JDouble.fromRawLongBits(0x4693B8B5B5056E17n), // 1.0E32
  JDouble.fromRawLongBits(0x4D384F03E93FF9F5n), // 1.0E64
  JDouble.fromRawLongBits(0x5A827748F9301D32n), // 1.0E128
  JDouble.fromRawLongBits(0x75154FDD7F73BF3Cn), // 1.0E256
];
const TINY_10_POW: JDouble[] = [
  JDouble.fromRawLongBits(0x3C9CD2B297D889BCn), // 1.0E-16
  JDouble.fromRawLongBits(0x3949F623D5A8A733n), // 1.0E-32
  JDouble.fromRawLongBits(0x32A50FFD44F4A73Dn), // 1.0E-64
  JDouble.fromRawLongBits(0x255BBA08CF8C979Dn), // 1.0E-128
  JDouble.fromRawLongBits(0x0AC8062864AC6F43n), // 1.0E-256
];

const MAX_SMALL_TEN = new JInt(SMALL_10_POW.length - 1);
const SINGLE_MAX_SMALL_TEN = new JInt(SINGLE_SMALL_10_POW.length - 1);

class FDBigInteger {
  private data: JInt[];
  private offset: JInt;
  private nWords: JInt;
  private isImmutable: boolean = false;

  constructor(lValue: JLong, digits: string[], kDigits: JInt, nDigits: JInt) {
    // TODO
  }

  public static valueOfMulPow52(value: JLong, p5: JInt, p2: JInt): FDBigInteger {
    // TODO
  }

  public leftShift(shift: JInt): FDBigInteger {
    // TODO
  }

  public multByPow52(p5: JInt, p2: JInt): FDBigInteger {
    // TODO
  }

  public leftInplaceSub(subtrahend: FDBigInteger): FDBigInteger {
    // TODO
  }

  public rightInplaceSub(subtrahend: FDBigInteger): FDBigInteger {
    // TODO
  }

  public cmp(other: FDBigInteger): JInt {
    // TODO
  }

  public cmpPow52(p5: JInt, p2: JInt): JInt {
    // TOOD
  }

  public makeImmutable() {
    this.isImmutable = true;
  }
}

interface ASCIIToBinaryConverter {

  doubleValue(): JDouble;

  floatValue(): JFloat;
}

class ASCIIToBinaryBuffer implements ASCIIToBinaryConverter {
  private readonly isNegative: boolean;
  private readonly decExponent: JInt;
  private readonly digits: string[];
  private nDigits: JInt;

  constructor(isNegative: boolean, decExponent: JInt, digits: string[], nDigits: JInt) {
    this.isNegative = isNegative;
    this.decExponent = decExponent;
    this.digits = digits;
    this.nDigits = nDigits;
  }

  public doubleValue(): JDouble {
    const kDigits = JMath.imin(this.nDigits, MAX_DECIMAL_DIGITS.plus(JINT_ONE).intValue());
    // convert the lead kDigits to a long integer.
    // (special performance hack: start to do it using int)
    let iValue = new JInt(parseInt(this.digits[0]));
    const iDigits = JMath.imin(kDigits, INT_DECIMAL_DIGITS);
    for (let i = JINT_ONE; i.lessThan(iDigits); i = i.plus(JINT_ONE).intValue()) {
      iValue = iValue.multiply(JINT_TEN).plus(new JInt(parseInt(this.digits[i.asJsNumber()]))).intValue();
    }
    let lValue = iValue.longValue();
    for (let i = iDigits; i.lessThan(kDigits); i = i.plus(JINT_ONE).intValue()) {
      lValue = lValue.multiply(JLONG_TEN).plus(new JLong(parseInt(this.digits[i.asJsNumber()]))).longValue();
    }
    let dValue = lValue.doubleValue();
    let exp = this.decExponent.minus(kDigits).intValue();
    // lValue now contains a long integer with the value of
    // the first kDigits digits of the number.
    // dValue contains the (double) of the same.

    if (this.nDigits.lessThanEqual(MAX_DECIMAL_DIGITS)) {
      // possibly an easy case.
      // We know that the digits can be represented
      // exactly. And if the exponent isn't too outrageous,
      // the whole thing can be done with one operation,
      // thus one rounding error.
      // Note that all our constructors trim all leading and
      // trailing zeros, so simple values (including zero)
      // will always end up here
      if (exp.equal(JINT_ZERO) || dValue.equal(JDOUBLE_ZERO)) {
        return this.isNegative ? dValue.multiply(JDOUBLE_ONE_NEGATIVE).doubleValue() : dValue; // small floating integer
      } else if (exp.greaterThanEqual(JINT_ZERO)) {
        if (exp.lessThanEqual(MAX_SMALL_TEN)) {
          // can get the answer with one operation, thus one roundoff
          const rValue = dValue.multiply(SMALL_10_POW[exp.asJsNumber()]);
          return (this.isNegative ? rValue.multiply(JDOUBLE_ONE_NEGATIVE) : rValue).doubleValue();
        }
        const slop = MAX_DECIMAL_DIGITS.minus(kDigits).intValue();
        if (exp.lessThanEqual(MAX_SMALL_TEN.plus(slop))) {
          // We can multiply dValue by 10^(slop)
          // and it is still "small" and exact.
          // Then we can multiply by 10^(exp-slop)
          // with one rounding.
          dValue = dValue.multiply(SMALL_10_POW[slop.asJsNumber()]).doubleValue();
          const rValue = dValue.multiply(SMALL_10_POW[exp.minus(slop).asJsNumber()]);
          return (this.isNegative ? rValue.multiply(JDOUBLE_ONE_NEGATIVE) : rValue).doubleValue();
        }
        // else we have a hard case with a positive exp
      } else {
        if (exp.greaterThanEqual(MAX_SMALL_TEN.multiply(JINT_ONE_NEGATIVE))) {
          // can get the answer in one division
          const rValue = dValue.divide(SMALL_10_POW[exp.multiply(JINT_ONE_NEGATIVE).asJsNumber()]);
          return (this.isNegative ? rValue.multiply(JDOUBLE_ONE_NEGATIVE) : rValue).doubleValue();
        }
        // else we have a hard case with a negative exp
      }
    }

    // Harder cases:
    // The sum of digits plus exponent is greater than
    // what we think we can do with one error.
    //
    // Start by approximating the right answer by,
    // naively, scaling by powers of 10.
    if (exp.greaterThan(JINT_ZERO)) {
      if (this.decExponent.greaterThan(MAX_DECIMAL_EXPONENT.plus(JINT_ONE))) {
        // Lets face it. This is going to be
        // Infinity. Cut to the chase.
        return this.isNegative ? JDOUBLE_INFINITY_NEGATIVE : JDOUBLE_INFINITY;
      }
      if (!exp.and(new JInt(15)).equal(JINT_ZERO)) {
        dValue = dValue.multiply(SMALL_10_POW[exp.and(new JInt(15)).asJsNumber()]).doubleValue();
      }
      exp = exp.shiftRight(JINT_FOUR).intValue();
      if (!exp.equal(JINT_ZERO)) {
        let j: JInt;
        for (j = JINT_ZERO;
             exp.greaterThan(JINT_ONE);
             j = j.plus(JINT_ONE).intValue(),
                 exp = exp.shiftRight(JINT_ONE).intValue()) {
          if (!exp.and(JINT_ONE).equal(JINT_ZERO)) {
            dValue = dValue.multiply(BIG_10_POW[j.asJsNumber()]).doubleValue();
          }
        }
        // The reason for the weird exp > 1 condition
        // in the above loop was so that the last multiply
        // would get unrolled. We handle it here.
        // It could overflow.
        let t = dValue.multiply(BIG_10_POW[j.asJsNumber()]).doubleValue();
        if (t.isInfinite()) {
          // It did overflow.
          // Look more closely at the result.
          // If the exponent is just one too large,
          // then use the maximum finite as our estimate
          // value. Else call the result infinity
          // and punt it.
          // (I presume this could happen because
          // rounding forces the result here to be
          // an ULP or two larger than
          // Double.MAX_VALUE)
          t = dValue.divide(JDOUBLE_TWO_POSITIVE).doubleValue();
          t = t.multiply(BIG_10_POW[j.asJsNumber()]).doubleValue();
          if (t.isInfinite()) {
            return this.isNegative ? JDOUBLE_INFINITY_NEGATIVE : JDOUBLE_INFINITY;
          }
          t = JDOUBLE_MAX_VALUE;
        }
        dValue = t;
      }
    } else if (exp.lessThan(JINT_ZERO)) {
      exp = exp.multiply(JINT_ONE_NEGATIVE).intValue();
      if (this.decExponent.lessThan(MIN_DECIMAL_EXPONENT.minus(JINT_ONE))) {
        // Lets face it. This is going to be
        // zero. Cut to the chase.
        return this.isNegative ? JDOUBLE_ZERO_NEGATIVE : JDOUBLE_ZERO;
      }
      if (!exp.and(new JInt(15)).equal(JINT_ZERO)) {
        dValue = dValue.divide(SMALL_10_POW[exp.and(new JInt(15)).asJsNumber()]).doubleValue();
      }
      exp = exp.shiftRight(JINT_FOUR).intValue();
      if (!exp.equal(JINT_ZERO)) {
        let j: JInt;
        for (j = JINT_ZERO;
             exp.greaterThan(JINT_ONE);
             j = j.plus(JINT_ONE).intValue(),
                 exp = exp.shiftRight(JINT_ONE).intValue()) {
          if (!exp.and(JINT_ONE).equal(JINT_ZERO)) {
            dValue = dValue.multiply(TINY_10_POW[j.asJsNumber()]).doubleValue();
          }
        }
        // The reason for the weird exp > 1 condition
        // in the above loop was so that the last multiply
        // would get unrolled. We handle it here.
        // It could underflow.
        let t = dValue.multiply(TINY_10_POW[j.asJsNumber()]).doubleValue();
        if (t.equal(JDOUBLE_ZERO)) {
          // It did underflow.
          // Look more closely at the result.
          // If the exponent is just one too small,
          // then use the minimum finite as our estimate
          // value. Else call the result 0.0
          // and punt it.
          // ( I presume this could happen because
          // rounding forces the result here to be
          // an ULP or two less than
          // Double.MIN_VALUE ).
          t = dValue.multiply(JDOUBLE_TWO_POSITIVE).doubleValue();
          t = t.multiply(TINY_10_POW[j.asJsNumber()]).doubleValue();
          if (t.equal(JDOUBLE_ZERO)) {
            return this.isNegative ? JDOUBLE_ZERO_NEGATIVE : JDOUBLE_ZERO;
          }
          t = JDOUBLE_MIN_VALUE;
        }
        dValue = t;
      }
    }

    // dValue is now approximately the result.
    // The hard part is adjusting it, by comparison
    // with FDBigInteger arithmetic.
    // Formulate the EXACT big-number result as
    // bigD0 * 10^exp
    if (this.nDigits.greaterThan(MAX_NDIGITS)) {
      this.nDigits = MAX_NDIGITS.plus(JINT_ONE).intValue();
      this.digits[MAX_NDIGITS.asJsNumber()] = "1";
    }
    let bigD0 = new FDBigInteger(lValue, this.digits, kDigits, this.nDigits);
    exp = this.decExponent.minus(this.nDigits).intValue();

    let ieeeBits = dValue.getRawLongBits(); // IEEE-754 bits of double candidate
    const B5 = JMath.imax(JINT_ZERO, exp.multiply(JINT_ONE_NEGATIVE).intValue()); // powers of 5 in bigB, value is not modified inside correctionLoop
    const D5 = JMath.imax(JINT_ZERO, exp); // powers of 5 in bigD, value is not modified inside correctionLoop
    bigD0 = bigD0.multByPow52(D5, JINT_ZERO);
    bigD0.makeImmutable(); // prevent bigD0 modification inside correctionLoop
    let bigD: FDBigInteger | undefined = undefined;
    let prevD2 = JINT_ZERO;

    correctionLoop:
        while (true) {
          // here ieeeBits can't be NaN, Infinity or zero
          let binexp = ieeeBits.unsignedShiftRight(EXP_SHIFT).intValue();
          let bigBbits = ieeeBits.and(JDOUBLE_SIGNIF_BIT_MASK).longValue();
          if (binexp.greaterThan(JINT_ZERO)) {
            bigBbits = bigBbits.or(FRACT_HOB).longValue();
          } else { // normalize denormalized numbers
            assert(!bigBbits.equal(JLONG_ZERO));
            const leadingZeros = bigBbits.numberOfLeadingZeros();
            const shift = leadingZeros.minus(new JInt(63).minus(EXP_SHIFT)).intValue();
            bigBbits = bigBbits.shiftLeft(shift).longValue();
            binexp = new JInt(1).minus(shift).intValue();
          }
          binexp = binexp.minus(JDOUBLE_EXP_BIAS).intValue();
          const lowOrderZeros = bigBbits.numberOfTrailingZeros();
          bigBbits = bigBbits.unsignedShiftRight(lowOrderZeros).longValue();
          const bigIntExp = binexp.minus(EXP_SHIFT).plus(lowOrderZeros).intValue();
          const bigIntNBits = EXP_SHIFT.plus(JINT_ONE).minus(lowOrderZeros).intValue();

          // Scale bigD, bigB appropriately for
          // big-integer operations.
          // Naively, we multiply by powers of ten
          // and powers of two. What we actually do
          // is keep track of the powers of 5 and
          // powers of 2 we would use, then factor out
          // common divisors before doing the work.
          let B2 = B5; // powers of 2 in bigB
          let D2 = D5; // powers of 2 in bigD
          let Ulp2: JInt; // powers of 2 in halfUlp
          if (bigIntExp.greaterThanEqual(JINT_ZERO)) {
            B2 = B2.plus(bigIntExp).intValue();
          } else {
            D2 = D2.minus(bigIntExp).intValue();
          }
          Ulp2 = B2;
          // shift bigB and bigD left by a number s. t.
          // halfUlp is still an integer.
          let hulpbias: JInt;
          if (binexp.lessThanEqual(JDOUBLE_EXP_BIAS.multiply(JDOUBLE_ONE_NEGATIVE))) {
            // This is going to be a denormalized number
            // (if not actually zero).
            // half an ULP is at 2^-(DoubleConsts.EXP_BIAS+EXP_SHIFT+1)
            hulpbias = binexp.plus(lowOrderZeros).plus(JDOUBLE_EXP_BIAS).intValue();
          } else {
            hulpbias = JINT_ONE.plus(lowOrderZeros).intValue();
          }
          B2 = B2.plus(hulpbias).intValue();
          D2 = D2.plus(hulpbias).intValue();
          // if there are common factors of 2, we might just as well
          // factor them out, as they add nothing useful.
          const common2 = JMath.imin(B2, JMath.imin(D2, Ulp2));
          B2 = B2.minus(common2).intValue();
          D2 = D2.minus(common2).intValue();
          Ulp2 = Ulp2.minus(common2).intValue();
          // do multiplications by powers of 5 and 2
          const bigB = FDBigInteger.valueOfMulPow52(bigBbits, B5, B2);
          if ((bigD === undefined || bigD === null) || !prevD2.equal(D2)) {
            bigD = bigD0.leftShift(D2);
            prevD2 = D2;
          }
          // to recap:
          // bigB is the scaled-big-int version of our floating-point
          // candidate.
          // bigD is the scaled-big-int version of the exact value
          // as we understand it.
          // halfUlp is 1/2 an ulp of bigB, except for special cases
          // of exact powers of 2
          //
          // the plan is to compare bigB with bigD, and if the difference
          // is less than halfUlp, then we're satisfied. Otherwise,
          // use the ratio of difference to halfUlp to calculate a fudge
          // factor to add to the floating value, then go 'round again.
          let diff: FDBigInteger;
          let cmpResult = bigB.cmp(bigD);
          let overvalue: boolean;
          if (cmpResult.greaterThan(JINT_ZERO)) {
            overvalue = true; // our candidate is too big
            diff = bigB.leftInplaceSub(bigD); // bigB is not used further - reuse
            if (bigIntNBits.equal(JINT_ONE) && bigIntExp.greaterThan(JDOUBLE_EXP_BIAS.multiply(JINT_ONE_NEGATIVE).plus(JINT_ONE))) {
              // candidate is a normalized exact power of 2 and
              // is too big (larger than Double.MIN_NORMAL). We will be subtracting.
              // For our purposes, ulp is the ulp of the
              // next smaller range.
              Ulp2 = Ulp2.minus(JINT_ONE).intValue();
              if (Ulp2.lessThan(JINT_ZERO)) {
                // rats. Cannot de-scale ulp this far.
                // must scale diff in other direction.
                Ulp2 = JINT_ZERO;
                diff = diff.leftShift(JINT_ONE);
              }
            }
          } else if (cmpResult.lessThan(JINT_ZERO)) {
            overvalue = false; // our candidate is too small.
            diff = bigD.rightInplaceSub(bigB); // bigB is not used further - reuse
          } else {
            // the candidate is exactly right!
            // this happens with surprising frequency
            break correctionLoop;
          }
          cmpResult = diff.cmpPow52(B5, Ulp2);
          if (cmpResult.lessThan(JINT_ZERO)) {
            // difference is small.
            // this is close enough
            break correctionLoop;
          } else if (cmpResult.equal(JINT_ZERO)) {
            // difference is exactly half an ULP
            // round to some other value maybe, then finish
            if (!ieeeBits.and(JINT_ZERO).equal(JINT_ZERO)) { // half ties to even
              ieeeBits = ieeeBits.plus(overvalue ? JLONG_ONE_NEGATIVE : JLONG_ONE).longValue(); // nextDown or nextUp
            }
            break correctionLoop;
          } else {
            // difference is non-trivial.
            // could scale addend by ratio of difference to
            // halfUlp here, if we bothered to compute that difference.
            // Most of the time (I hope) it is about 1 anyway.
            ieeeBits = ieeeBits.plus(overvalue ? JLONG_ONE_NEGATIVE : JLONG_ONE).longValue(); // nextDown or nextUp
            if (ieeeBits.equal(JLONG_ZERO) || ieeeBits.equal(JDOUBLE_EXP_BIT_MASK)) { // 0.0 or Double.POSITIVE_INFINITY
              break correctionLoop; // oops. Fell off end of range.
            }
            // noinspection UnnecessaryContinueJS
            continue; // try again.
          }
        }
    if (this.isNegative) {
      ieeeBits = ieeeBits.or(JDOUBLE_SIGN_BIT_MASK).longValue();
    }
    return JDouble.fromRawLongBits(ieeeBits);
  }

  public floatValue(): JFloat {
    const kDigits = JMath.imin(this.nDigits, SINGLE_MAX_DECIMAL_DIGITS.plus(JINT_ONE).intValue());
    // convert the lead kDigits to an integer.
    let iValue = new JInt(parseInt(this.digits[0]));
    for (let i = JINT_ONE; i.lessThan(kDigits); i = i.plus(JINT_ONE).intValue()) {
      iValue = iValue.multiply(JINT_TEN).plus(new JInt(parseInt(this.digits[i.asJsNumber()]))).intValue();
    }
    let fValue = iValue.floatValue();
    let exp = this.decExponent.minus(kDigits).intValue();
    // iValue now contains an integer with the value of
    // the first kDigits digits of the number.
    // fValue contains the (float) of the same.

    if (this.nDigits.lessThanEqual(SINGLE_MAX_DECIMAL_DIGITS)) {
      // possibly an easy case.
      // We know that the digits can be represented
      // exactly. And if the exponent isn't too outrageous,
      // the whole thing can be done with one operation,
      // thus one rounding error.
      // Note that all our constructors trim all leading and
      // trailing zeros, so simple values (including zero)
      // will always end up here.
      if (exp.equal(JINT_ZERO) || fValue.equal(JFLOAT_ZERO)) {
        return this.isNegative ? fValue.multiply(JFLOAT_ONE_NEGATIVE).floatValue() : fValue; // small floating integer
      } else if (exp.greaterThanEqual(JINT_ZERO)) {
        if (exp.lessThanEqual(SINGLE_MAX_SMALL_TEN)) {
          // Can get the answer with one operation,
          // thus one roundoff.
          fValue = fValue.multiply(SINGLE_SMALL_10_POW[exp.asJsNumber()]).floatValue();
          return this.isNegative ? fValue.multiply(JFLOAT_ONE_NEGATIVE).floatValue() : fValue;
        }
        const slop = SINGLE_MAX_DECIMAL_DIGITS.minus(kDigits).intValue();
        if (exp.lessThanEqual(SINGLE_MAX_SMALL_TEN.plus(slop))) {
          // We can multiply fValue by 10^(slop)
          // and it is still "small" and exact.
          // Then we can multiply by 10^(exp-slop)
          // with one rounding.
          fValue = fValue.multiply(SINGLE_SMALL_10_POW[slop.asJsNumber()]).floatValue();
          fValue = fValue.multiply(SINGLE_SMALL_10_POW[exp.minus(slop).asJsNumber()]).floatValue();
          return this.isNegative ? fValue.multiply(JFLOAT_ONE_NEGATIVE).floatValue() : fValue;
        }
        // Else we have a hard case with a positive exp.
      } else {
        if (exp.greaterThanEqual(SINGLE_MAX_SMALL_TEN.multiply(JINT_ONE_NEGATIVE))) {
          // Can get the answer in one division.
          fValue = fValue.divide(SINGLE_SMALL_10_POW[exp.multiply(JINT_ONE_NEGATIVE).asJsNumber()]).floatValue();
          return this.isNegative ? fValue.multiply(JFLOAT_ONE_NEGATIVE).floatValue() : fValue;
        }
        // Else we have a hard case with a negative exp.
      }
    } else if (this.decExponent.greaterThanEqual(this.nDigits)
        && this.nDigits.plus(this.decExponent).lessThanEqual(MAX_DECIMAL_DIGITS)) {
      // In double-precision, this is an exact floating integer.
      // So we can compute to double, then shorten to float
      // with one round, and get the right answer.
      //
      // First, finish accumulating digits.
      // Then convert that integer to a double, multiply
      // by the appropriate power of ten, and convert to float.
      let lValue = iValue.longValue();
      for (let i = kDigits; i.lessThan(this.nDigits); i = i.plus(JINT_ONE).intValue()) {
        lValue = lValue.multiply(JLONG_TEN).plus(new JLong(parseInt(this.digits[i.asJsNumber()]))).longValue();
      }
      let dValue = lValue.doubleValue();
      exp = this.decExponent.minus(this.nDigits).intValue();
      dValue = dValue.multiply(SMALL_10_POW[exp.asJsNumber()]).doubleValue();
      fValue = dValue.floatValue();
      return this.isNegative ? fValue.multiply(JFLOAT_ONE_NEGATIVE).floatValue() : fValue;
    }
    // Harder cases:
    // The sum of digits plus exponent is greater than
    // what we think we can do with one error.
    //
    // Start by approximating the right answer by,
    // naively, scaling by powers of 10.
    // Scaling uses doubles to avoid overflow/underflow.
    let dValue = fValue.doubleValue();
    if (exp.greaterThan(JINT_ZERO)) {
      if (this.decExponent.greaterThan(SINGLE_MAX_DECIMAL_EXPONENT.plus(JINT_ONE))) {
        // Lets face it. This is going to be
        // Infinity. Cut to the chase.
        return this.isNegative ? JFLOAT_INFINITY_NEGATIVE : JFLOAT_INFINITY;
      }
      if (!exp.and(new JInt(15)).equal(JINT_ZERO)) {
        dValue = dValue.multiply(SMALL_10_POW[exp.and(new JInt(15)).asJsNumber()]).doubleValue();
      }
      exp = exp.shiftRight(JINT_FOUR).intValue();
      if (!exp.equal(JINT_ZERO)) {
        let j: JInt;
        for (j = JINT_ZERO;
             exp.greaterThan(JINT_ZERO);
             j = j.plus(JINT_ONE).intValue(),
                 exp = exp.shiftRight(JINT_ONE).intValue()) {
          if (!exp.and(JINT_ONE).equal(JINT_ZERO)) {
            dValue = dValue.multiply(BIG_10_POW[j.asJsNumber()]).doubleValue();
          }
        }
      }
    } else if (exp.lessThan(JINT_ZERO)) {
      exp = exp.multiply(JINT_ONE_NEGATIVE).intValue();
      if (this.decExponent.lessThan(SINGLE_MIN_DECIMAL_EXPONENT.minus(JINT_ONE))) {
        // Lets face it. This is going to be
        // zero. Cut to the chase.
        return this.isNegative ? JFLOAT_ZERO_NEGATIVE : JFLOAT_ZERO;
      }
      if (!exp.and(new JInt(15)).equal(JINT_ZERO)) {
        dValue = dValue.divide(SMALL_10_POW[exp.and(new JInt(15)).asJsNumber()]).doubleValue();
      }
      exp = exp.shiftRight(JINT_FOUR).intValue();
      if (!exp.equal(JINT_ZERO)) {
        let j: JInt;
        for (j = JINT_ZERO;
             exp.greaterThan(JINT_ZERO);
             j = j.plus(JINT_ONE).intValue(),
                 exp = exp.shiftRight(JINT_ONE).intValue()) {
          if (!exp.and(JINT_ONE).equal(JINT_ZERO)) {
            dValue = dValue.multiply(TINY_10_POW[j.asJsNumber()]).doubleValue();
          }
        }
      }
    }
    fValue = JMath.fclamp(dValue.floatValue(), JFLOAT_MIN_VALUE, JFLOAT_MAX_VALUE);

    // fValue is now approximately the result.
    // The hard part is adjusting it, by comparison
    // with FDBigInteger arithmetic.
    // Formulate the EXACT big-number result as
    // bigD0 * 10^exp
    if (this.nDigits.greaterThan(SINGLE_MAX_NDIGITS)) {
      this.nDigits = SINGLE_MAX_NDIGITS.plus(JINT_ONE).intValue();
      this.digits[SINGLE_MAX_NDIGITS.asJsNumber()] = "1";
    }
    let bigD0 = new FDBigInteger(iValue.longValue(), this.digits, kDigits, this.nDigits);
    exp = this.decExponent.minus(this.nDigits).intValue();

    let ieeeBits = fValue.getRawIntBits(); // IEEE-754 bits of float candidate
    const B5 = JMath.imax(JINT_ZERO, exp.multiply(JINT_ONE_NEGATIVE).intValue()); // powers of 5 in bigB, value is not modified inside correctionLoop
    const D5 = JMath.imax(JINT_ZERO, exp); // powers of 5 in bigD, value is not modified inside correctionLoop
    bigD0 = bigD0.multByPow52(D5, JINT_ZERO);
    bigD0.makeImmutable(); // prevent bigD0 modification inside correctionLoop
    let bigD: FDBigInteger | undefined = undefined;
    let prevD2 = JINT_ZERO;

    correctionLoop:
        while (true) {
          // here ieeeBits can't be NaN, Infinity or zero
          let binexp = ieeeBits.unsignedShiftRight(SINGLE_EXP_SHIFT).intValue();
          let bigBbits = ieeeBits.and(JFLOAT_SIGNIF_BIT_MASK).intValue();
          if (binexp.greaterThan(JINT_ZERO)) {
            bigBbits = bigBbits.or(SINGLE_FRACT_HOB).intValue();
          } else { // normalize denormalized numbers
            assert(!bigBbits.equal(JINT_ZERO));
            const leadingZeros = bigBbits.numberOfLeadingZeros();
            const shift = leadingZeros.minus(new JInt(31).minus(SINGLE_EXP_SHIFT)).intValue();
            bigBbits = bigBbits.shiftLeft(shift).intValue();
            binexp = JINT_ONE.minus(shift).intValue();
          }
          binexp = binexp.minus(JFLOAT_EXP_BIAS).intValue();
          const lowOrderZeros = bigBbits.numberOfTrailingZeros();
          bigBbits = bigBbits.unsignedShiftRight(lowOrderZeros).intValue();
          const bigIntExp = binexp.minus(SINGLE_EXP_SHIFT).plus(lowOrderZeros).intValue();
          const bigIntNBits = SINGLE_EXP_SHIFT.plus(JINT_ONE).minus(lowOrderZeros).intValue();

          // Scale bigD, bigB appropriately for
          // big-integer operations.
          // Naively, we multiply by powers of ten
          // and powers of two. What we actually do
          // is keep track of the powers of 5 and
          // powers of 2 we would use, then factor out
          // common divisors before doing the work.
          let B2 = B5; // powers of 2 in bigB
          let D2 = D5; // powers of 2 in bigD
          let Ulp2: JInt; // powers of 2 in halfUlp
          if (bigIntExp.greaterThanEqual(JINT_ZERO)) {
            B2 = B2.plus(bigIntExp).intValue();
          } else {
            D2 = D2.minus(bigIntExp).intValue();
          }
          Ulp2 = B2;
          // shift bigB and bigD left by a number s. t.
          // halfUlp is still an integer.
          let hulpbias: JInt;
          if (binexp.lessThanEqual(JFLOAT_EXP_BIAS.multiply(JFLOAT_ONE_NEGATIVE))) {
            // This is going to be a denormalized number
            // (if not actually zero).
            // half an ULP is at 2^-(FloatConsts.EXP_BIAS+SINGLE_EXP_SHIFT+1)
            hulpbias = binexp.plus(lowOrderZeros).plus(JFLOAT_EXP_BIAS).intValue();
          } else {
            hulpbias = JINT_ONE.plus(lowOrderZeros).intValue();
          }
          B2 = B2.plus(hulpbias).intValue();
          D2 = D2.plus(hulpbias).intValue();
          // if there are common factors of 2, we might just as well
          // factor them out, as they add nothing useful.
          const common2 = JMath.imin(B2, JMath.imin(D2, Ulp2));
          B2 = B2.minus(common2).intValue();
          D2 = D2.minus(common2).intValue();
          Ulp2 = Ulp2.minus(common2).intValue();
          // do multiplications by powers of 5 and 2
          const bigB = FDBigInteger.valueOfMulPow52(bigBbits.longValue(), B5, B2);
          if ((bigD === undefined || bigD === null) || !prevD2.equal(D2)) {
            bigD = bigD0.leftShift(D2);
            prevD2 = D2;
          }
          // to recap:
          // bigB is the scaled-big-int version of our floating-point
          // candidate.
          // bigD is the scaled-big-int version of the exact value
          // as we understand it.
          // halfUlp is 1/2 an ulp of bigB, except for special cases
          // of exact powers of 2
          //
          // the plan is to compare bigB with bigD, and if the difference
          // is less than halfUlp, then we're satisfied. Otherwise,
          // use the ratio of difference to halfUlp to calculate a fudge
          // factor to add to the floating value, then go 'round again.
          let diff: FDBigInteger;
          let cmpResult = bigB.cmp(bigD);
          let overvalue: boolean;
          if (cmpResult.greaterThan(JINT_ZERO)) {
            overvalue = true; // our candidate is too big.
            diff = bigB.leftInplaceSub(bigD); // bigB is not used further - reuse
            if (bigIntNBits.equal(JINT_ONE) && bigIntExp.greaterThan(JFLOAT_EXP_BIAS.multiply(JINT_ONE_NEGATIVE).plus(JINT_ONE))) {
              // candidate is a normalized exact power of 2 and
              // is too big (larger than Float.MIN_NORMAL). We will be subtracting.
              // For our purposes, ulp is the ulp of the
              // next smaller range.
              Ulp2 = Ulp2.minus(JINT_ONE).intValue();
              if (Ulp2.lessThan(JINT_ZERO)) {
                // rats. Cannot de-scale ulp this far.
                // must scale diff in other direction.
                Ulp2 = JINT_ZERO;
                diff = diff.leftShift(JINT_ONE);
              }
            }
          } else if (cmpResult.lessThan(JINT_ZERO)) {
            overvalue = false; // our candidate is too small.
            diff = bigD.rightInplaceSub(bigB); // bigB is not used further - reuse
          } else {
            // the candidate is exactly right!
            // this happens with surprising frequency
            break correctionLoop;
          }
          cmpResult = diff.cmpPow52(B5, Ulp2);
          if (cmpResult.lessThan(JINT_ZERO)) {
            // difference is small.
            // this is close enough
            break correctionLoop;
          } else if (cmpResult.equal(JINT_ZERO)) {
            // difference is exactly half an ULP
            // round to some other value maybe, then finish
            if (!ieeeBits.and(JINT_ZERO).equal(JINT_ZERO)) { // half ties to even
              ieeeBits = ieeeBits.plus(overvalue ? JINT_ONE_NEGATIVE : JINT_ONE).intValue(); // nextDown or nextUp
            }
            break correctionLoop;
          } else {
            // difference is non-trivial.
            // could scale addend by ratio of difference to
            // halfUlp here, if we bothered to compute that difference.
            // Most of the time (I hope) it is about 1 anyway.
            ieeeBits = ieeeBits.plus(overvalue ? JINT_ONE_NEGATIVE : JINT_ONE).intValue(); // nextDown or nextUp
            if (ieeeBits.equal(JLONG_ZERO) || ieeeBits.equal(JFLOAT_EXP_BIT_MASK)) { // 0.0 or Float.POSITIVE_INFINITY
              break correctionLoop; // oops. Fell off end of range.
            }
            // noinspection UnnecessaryContinueJS
            continue; // try again.
          }
        }
    if (this.isNegative) {
      ieeeBits = ieeeBits.or(JFLOAT_SIGN_BIT_MASK).intValue();
    }
    return JFloat.fromRawIntBits(ieeeBits);
  }
}

const createStaticConverter = (double: JDouble, float: JFloat) => {
  return {
    doubleValue: () => double,
    floatValue: () => float,
  } as ASCIIToBinaryConverter;
};

const A2BC_POSITIVE_INFINITY = createStaticConverter(JDOUBLE_INFINITY, JFLOAT_INFINITY);
const A2BC_NEGATIVE_INFINITY = createStaticConverter(JDOUBLE_INFINITY_NEGATIVE, JFLOAT_INFINITY_NEGATIVE);
const A2BC_NOT_A_NUMBER = createStaticConverter(JDOUBLE_NOT_A_NUMBER, JFLOAT_NOT_A_NUMBER);
const A2BC_POSITIVE_ZERO = createStaticConverter(JDOUBLE_ZERO, JFLOAT_ZERO);
const A2BC_NEGATIVE_ZERO = createStaticConverter(JDOUBLE_ZERO_NEGATIVE, JFLOAT_ZERO_NEGATIVE);

export const parseFloat = (input: string) => readJavaFormatString(input).floatValue();
export const parseDouble = (input: string) => readJavaFormatString(input).doubleValue();

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
        i = i.plus(JINT_ONE).intValue();
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
      if (len.greaterThan(i.plus(JINT_ONE))) {
        const ch = input.charAt(i.plus(JINT_ONE).asJsNumber());
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
            nLeadZero = nLeadZero.plus(JINT_ONE).intValue();
          } else if (c === ".") {
            if (decSeen) {
              // already saw one ., this is the 2nd.
              throw new Error("multiple points");
            }
            decPt = i;
            if (signSeen) {
              decPt = decPt.minus(JINT_ONE).intValue();
            }
            decSeen = true;
          } else {
            break skipLeadingZerosLoop;
          }
          i = i.plus(JINT_ONE).intValue();
        }
    digitLoop:
        while (i.lessThan(len)) {
          c = input.charAt(i.asJsNumber());
          if (c >= "1" && c <= "9") {
            digits[nDigits.asJsNumber()] = c;
            nDigits = nDigits.plus(JINT_ONE).intValue();
            nTrailZero = JINT_ZERO;
          } else if (c === "0") {
            digits[nDigits.asJsNumber()] = c;
            nDigits = nDigits.plus(JINT_ONE).intValue();
            nTrailZero = nTrailZero.plus(JINT_ONE).intValue();
          } else if (c === ".") {
            if (decSeen) {
              // already saw one ., this is the 2nd.
              throw new Error("multiple points");
            }
            decPt = i;
            if (signSeen) {
              decPt = decPt.minus(JINT_ONE).intValue();
            }
            decSeen = true;
          } else {
            break digitLoop;
          }
          i = i.plus(JINT_ONE).intValue();
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
      let expSign = JINT_ONE;
      let expVal = JINT_ZERO;
      const reallyBig = JINT_MAX_VALUE.divide(JINT_TEN);
      let expOverflow = false;
      i = i.plus(JINT_ONE).intValue();
      switch (input.charAt(i.asJsNumber())) {
        case "-":
          expSign = JINT_ONE_NEGATIVE;
          // fallthrough
        case "+":
          i = i.plus(JINT_ONE).intValue();
      }
      let expAt = i;
      expLoop:
          while (i.lessThan(len)) {
            if (expVal.greaterThanEqual(reallyBig)) {
              // the next character will cause integer overflow
              expOverflow = true;
            }
            c = input.charAt(i.asJsNumber());
            i = i.plus(JINT_ONE).intValue();
            if (c >= "0" && c <= "9") {
              expVal = expVal.multiply(JINT_TEN).plus(new JInt(parseInt(c, 10))).intValue();
            } else {
              i = i.minus(JINT_ONE).intValue(); // back up
              break expLoop; // stop parsing exponent
            }
          }
      const expLimit = BIG_DECIMAL_EXPONENT.plus(nDigits).plus(nTrailZero).intValue();
      if (expOverflow || (expVal.greaterThan(expLimit))) {
        // There is still a chance that the exponent will be safe to use:
        // if it would eventually decrease due to a negative decExp,
        // and that number is below the limit. We check for that here
        if (!expOverflow && (expSign.equal(JINT_ONE) && decExp.lessThan(JINT_ZERO))
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
        (!i.equal(len.minus(JINT_ONE)) ||
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
      if (leftDigits.greaterThanEqual(JINT_ONE)) { // cases 1 and 2
        exponentAdjust = JINT_FOUR.multiply(leftDigits.minus(JINT_ONE)).intValue();
      } else { // cases 3 and 4
        exponentAdjust = new JInt(-4).multiply(rightDigits.minus(signifLength).plus(JINT_ONE)).intValue();
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
        (positiveExponent ? JLONG_ONE : JLONG_ONE_NEGATIVE) // exponent sign
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
    if (leadingDigit.equal(JLONG_ONE)) {
      significand = significand.or(leadingDigit.shiftLeft(new JLong(52))).longValue();
      nextShift = new JInt(52 - 4);
      // exponent += 0
    } else if (leadingDigit.lessThanEqual(new JLong(3))) { // [2, 3]
      significand = significand.or(leadingDigit.shiftLeft(new JLong(51))).longValue();
      nextShift = new JInt(52 - 5);
      exponent = exponent.plus(JLONG_ONE).longValue();
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
    for (i = JINT_ONE;
         i.lessThan(signifLength) && nextShift.greaterThanEqual(JINT_ZERO);
         i = i.plus(JINT_ONE).intValue()) {
      let currentDigit = getHexDigit(significandString, i).longValue();
      significand = significand.or(currentDigit.shiftLeft(nextShift)).longValue();
      nextShift = nextShift.minus(JINT_FOUR).intValue();
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
        significand = significand.or(currentDigit.and(new JLong(0xE)).shiftRight(JLONG_ONE)).longValue();
        round = !currentDigit.and(JLONG_ONE).equal(JLONG_ZERO);
      } else if (nextShift.equal(new JInt(-2))) {
        // two bits need to be copied in; can
        // set round and start sticky
        significand = significand.or(currentDigit.and(new JLong(0xC)).shiftRight(new JLong(2))).longValue();
        round = !currentDigit.and(new JLong(2)).equal(JLONG_ZERO);
        sticky = !currentDigit.and(JLONG_ONE).equal(JLONG_ZERO);
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
      i = i.plus(JINT_ONE).intValue();
      while (i.lessThan(signifLength) && !sticky) {
        currentDigit = getHexDigit(significandString, i).longValue();
        sticky = sticky || !currentDigit.equal(JLONG_ZERO);
        i = i.plus(JINT_ONE).intValue();
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
        const threshShift = JDOUBLE_PRECISION.minus(JFLOAT_PRECISION).minus(JINT_ONE).intValue();
        const floatSticky = round || sticky || !significand.and(JLONG_ONE.shiftLeft(threshShift).minus(JLONG_ONE)).equal(JLONG_ZERO);
        let iValue = significand.unsignedShiftRight(threshShift).intValue();
        if (floatSticky || !iValue.and(new JInt(3)).equal(new JInt(1))) {
          iValue = iValue.plus(JINT_ONE).intValue();
        }
        floatBits = floatBits.or(
            exponent.intValue().plus(JFLOAT_EXP_BIAS.minus(JINT_ONE))
                .shiftLeft(JFLOAT_PRECISION.minus(JINT_ONE))
                .plus(iValue.shiftRight(JINT_ONE)),
        ).intValue();
      }
    } else {
      if (exponent.lessThan(JFLOAT_MIN_SUB_EXPONENT.minus(JINT_ONE))) {
        // 0
      } else {
        // exponent == -127 ==> threshShift = 53 - 2 + (-149) - (-127) = 53 - 24
        const threshShift = JDOUBLE_PRECISION.minus(JINT_TWO).plus(JFLOAT_MIN_SUB_EXPONENT).minus(exponent).intValue();
        assert(threshShift.greaterThanEqual(JDOUBLE_PRECISION.minus(JFLOAT_PRECISION)));
        assert(threshShift.lessThan(JDOUBLE_PRECISION));
        const floatSticky = round || sticky || !significand.and(JLONG_ONE.shiftLeft(threshShift)
            .minus(JLONG_ONE)).equal(JLONG_ZERO);
        let iValue = significand.unsignedShiftRight(threshShift).intValue();
        if (floatSticky || !iValue.and(new JInt(3)).equal(JINT_ONE)) {
          iValue = iValue.plus(JINT_ONE).intValue();
        }
        floatBits = floatBits.or(iValue.shiftRight(JINT_ONE)).intValue();
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
            .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE))
            .and(JDOUBLE_EXP_BIT_MASK)
            .or(JDOUBLE_SIGNIF_BIT_MASK.and(significand))
            .longValue();
      } else { // subnormal or zero
        // (exponent < Double.MIN_EXPONENT)

        if (exponent.lessThan(JDOUBLE_MIN_SUB_EXPONENT.minus(JINT_ONE))) {
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
              .minus(exponent.intValue().minus(JDOUBLE_MIN_SUB_EXPONENT).plus(JINT_ONE)).intValue();
          assert(bitsDiscarded.greaterThanEqual(JINT_ONE) && bitsDiscarded.lessThanEqual(new JInt(53)));

          // What to do here:
          // First, isolate the new round bit
          round = !significand.and(JLONG_ONE.shiftLeft(bitsDiscarded.minus(JINT_ONE))).equal(JLONG_ZERO);
          if (bitsDiscarded.greaterThan(JINT_ONE)) {
            // create mask to update sticky bits; low
            // order bitsDiscarded bits should be 1
            const mask = JLONG_ZERO.not().shiftLeft(bitsDiscarded.minus(JINT_ONE)).not().longValue();
            sticky = sticky || !significand.and(mask).equal(JLONG_ZERO);
          }

          // Now, discard the bits
          significand = significand.shiftRight(bitsDiscarded).longValue();

          significand = JDOUBLE_MIN_EXPONENT.minus(JINT_ONE).longValue() // subnorm exp.
              .plus(JDOUBLE_EXP_BIAS.longValue())
              .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE))
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
      const leastZero = significand.and(JLONG_ONE).equal(JLONG_ZERO);
      if ((leastZero && round && sticky) || (!leastZero && round)) {
        significand = significand.plus(JLONG_ONE).longValue();
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
  if (value.lessThanEqual(JINT_ONE_NEGATIVE) || value.greaterThanEqual(JINT_SIXTEEN)) {
    throw new Error(`Unexpected failure of digit conversion of ${s[position.asJsNumber()]}`);
  }
  return value;
};
