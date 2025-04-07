import JNumber from "./JNumber.js";
import JInt from "./JInt.js";
import {parseFloat} from "./JFloatingDecimal.js";
import {
  JFLOAT_BYTES,
  JFLOAT_INFINITY,
  JFLOAT_INFINITY_NEGATIVE,
  JFLOAT_NOT_A_NUMBER,
  JFLOAT_SIGN_BIT_MASK,
  JINT_ONE,
  JINT_ONE_NEGATIVE,
  JINT_ZERO,
} from "./NumberConstants.js";

export default class JFloat extends JNumber {
  private readonly value: bigint;

  private constructor(value: bigint) {
    super();
    const bigint = BigInt(value);
    this.value = BigInt.asUintN(JFLOAT_BYTES.asJsNumber(), bigint);
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
    return this.value === JFLOAT_INFINITY.value
        || this.value === JFLOAT_INFINITY_NEGATIVE.value;
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
      return new JInt(JFLOAT_NOT_A_NUMBER.value);
    }
    return this.getRawIntBits();
  }

  public getRawIntBits(): JInt {
    return new JInt(this.value);
  }
}
