import JNumber from "./JNumber.js";
import {JBYTE_SIZE} from "./JByte.js";
import JInt, {JINT_ONE_NEGATIVE, JINT_ONE} from "./JInt.js";
import {parseFloat} from "./JFloatingDecimal.js";
import JLong from "./JLong.js";

const JS_BITS = 32;

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

  public isNaN(): boolean {
    // TODO
  }

  public compareTo(anotherFloat: JFloat): JInt {
    // TODO
  }

  public getRawIntBits(): JInt {
    return new JInt(this.value)
  }
}

export const JFLOAT_ZERO = JFloat.fromRawIntBits(0n);
export const JFLOAT_ZERO_NEGATIVE = JFloat.fromRawIntBits(0x80000000n);
export const JFLOAT_ONE = JFloat.fromRawIntBits(0x3F800000n);
export const JFLOAT_ONE_NEGATIVE = JFloat.fromRawIntBits(0xBF800000n);
export const JFLOAT_INFINITY = JFloat.fromRawIntBits(0x7F800000n);
export const JFLOAT_INFINITY_NEGATIVE = JFloat.fromRawIntBits(0xFF800000n);
export const JFLOAT_NOT_A_NUMBER = JFloat.fromRawIntBits(0x7FC00000n);
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
export const JFLOAT_SIGNIF_BIT_MASK = JINT_ONE.shiftLeft(JFLOAT_PRECISION.minus(JINT_ONE)).minus(JINT_ONE)
