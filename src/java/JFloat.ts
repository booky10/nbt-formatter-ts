import JNumber from "./JNumber.js";
import {JBYTE_SIZE} from "./JByte.js";
import JInt, {JINT_ONE_NEGATIVE, JINT_ONE, JINT_ZERO} from "./JInt.js";
import {parseFloat} from "./JFloatingDecimal.js";

const JS_BITS = 32;
const DEF_NAN = 0x7FC00000n;
const INFIN_POS = 0x7F800000n;
const INFIN_NEG = 0xFF800000n;

export default class JFloat extends JNumber {
  private readonly value: bigint;

  private constructor(value: bigint) {
    super();
    const bigint = BigInt(value);
    this.value = BigInt.asUintN(JS_BITS, bigint);
  }

  static parseFloat(s: string) {
    return parseFloat(s);
  }

  static fromRawIntBits(bits: bigint | JNumber) {
    if (bits instanceof JNumber) {
      bits = bits.asJsBigint();
    }
    return new JFloat(bits);
  }

  asJsNumber(): number {
    // TODO check this again
    const bits = this.getRawIntBits();
    const sign = bits.and(JFLOAT_SIGN_BIT_MASK).equal(JINT_ZERO) ? 1 : -1;
    const exp = bits.shiftRight(new JInt(23)).and(new JInt(0xFF)).asJsNumber();
    const mul = exp === 0
        ? bits.and(new JInt(0x7FFFFF)).shiftLeft(JINT_ONE)
        : bits.and(new JInt(0x7FFFFF)).or(new JInt(0x800000));
    return sign * mul.asJsNumber() * (2 ** (exp - 150));
  }

  public isInfinite(): boolean {
    return this.value === INFIN_POS || this.value === INFIN_NEG;
  }

  public isNaN(): boolean {
    return this.value >= 0x7F800001n && this.value <= 0x7FFFFFFFn
        || this.value >= 0xFF800001n && this.value <= 0xFFFFFFFFn;
  }

  public compareTo(anotherFloat: JFloat): JInt {
    if (this.lessThan(anotherFloat)) {
      return JINT_ONE_NEGATIVE; // Neither val is NaN, thisVal is smaller
    } else if (anotherFloat.greaterThan(this)) {
      return JINT_ONE; // Neither val is NaN, thisVal is larger
    }

    // Cannot use floatToRawIntBits because of possibility of NaNs.
    const thisBits = this.getIntBits();
    const anotherBits = anotherFloat.getIntBits();

    return thisBits.equal(anotherBits)
        ? JINT_ZERO // values are equal
        : thisBits.lessThan(anotherFloat)
            ? JINT_ONE_NEGATIVE // (-0.0, 0.0) or (!NaN, NaN)
            : JINT_ONE; // (0.0, -0.0) or (NaN, !NaN)
  }

  public getIntBits(): JInt {
    if (this.isNaN()) {
      return new JInt(DEF_NAN);
    }
    return this.getRawIntBits();
  }

  public getRawIntBits(): JInt {
    return new JInt(this.value);
  }
}

export const JFLOAT_ZERO = JFloat.fromRawIntBits(0n);
export const JFLOAT_ZERO_NEGATIVE = JFloat.fromRawIntBits(0x80000000n);
export const JFLOAT_ONE = JFloat.fromRawIntBits(0x3F800000n);
export const JFLOAT_ONE_NEGATIVE = JFloat.fromRawIntBits(0xBF800000n);
export const JFLOAT_INFINITY = JFloat.fromRawIntBits(INFIN_POS);
export const JFLOAT_INFINITY_NEGATIVE = JFloat.fromRawIntBits(INFIN_NEG);
export const JFLOAT_NOT_A_NUMBER = JFloat.fromRawIntBits(DEF_NAN);
export const JFLOAT_MIN_VALUE = JFloat.fromRawIntBits(1n);
export const JFLOAT_MAX_VALUE = JFloat.fromRawIntBits(0x7F7FFFFFn);
export const JFLOAT_SIZE = new JInt(JS_BITS);
export const JFLOAT_PRECISION = new JInt(24);
export const JFLOAT_MAX_EXPONENT = JINT_ONE.shiftLeft(JFLOAT_SIZE.minus(JFLOAT_PRECISION).minus(JINT_ONE)).minus(JINT_ONE); // 127
export const JFLOAT_MIN_EXPONENT = JINT_ONE.minus(JFLOAT_MAX_EXPONENT); // -126
export const JFLOAT_BYTES = JFLOAT_SIZE.divide(JBYTE_SIZE);

export const JFLOAT_SIGN_BIT_MASK = JINT_ONE.shiftLeft(JFLOAT_SIZE.minus(JINT_ONE)).intValue();
export const JFLOAT_EXP_BIT_MASK = JINT_ONE.shiftLeft(JFLOAT_SIZE.minus(JFLOAT_PRECISION)).minus(JINT_ONE)
    .shiftLeft(JFLOAT_PRECISION.minus(JINT_ONE_NEGATIVE));
export const JFLOAT_MIN_SUB_EXPONENT = JFLOAT_MIN_EXPONENT.minus(JFLOAT_PRECISION.minus(JINT_ONE)); // -149
export const JFLOAT_EXP_BIAS = JINT_ONE.shiftLeft(JFLOAT_SIZE.minus(JFLOAT_PRECISION)
    .minus(JINT_ONE)).minus(JINT_ONE); // 127
export const JFLOAT_SIGNIF_BIT_MASK = JINT_ONE.shiftLeft(JFLOAT_PRECISION.minus(JINT_ONE)).minus(JINT_ONE);
