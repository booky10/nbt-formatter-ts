import JNumber from "./JNumber.js";
import JInt from "./JInt.js";
import JLong from "./JLong.js";
import {parseDouble} from "./JFloatingDecimal.js";
import {
  JDOUBLE_INFINITY,
  JDOUBLE_INFINITY_NEGATIVE,
  JDOUBLE_NOT_A_NUMBER,
  JDOUBLE_SIGN_BIT_MASK,
  JDOUBLE_SIZE,
  JINT_ONE,
  JINT_ONE_NEGATIVE,
  JINT_ZERO,
  JLONG_ONE,
  JLONG_ZERO,
} from "./NumberConstants.js";

export default class JDouble extends JNumber {
  private readonly value: bigint;

  private constructor(value: bigint) {
    super();
    const bigint = BigInt(value);
    this.value = BigInt.asUintN(JDOUBLE_SIZE.asJsNumber(), bigint);
  }

  static parseDouble(s: string) {
    return parseDouble(s);
  }

  static fromRawLongBits(bits: bigint | JNumber) {
    if (bits instanceof JNumber) {
      bits = bits.asJsBigint();
    }
    return new JDouble(bits);
  }

  asJsNumber(): number {
    // TODO check this again
    const bits = this.getRawLongBits();
    const sign = bits.and(JDOUBLE_SIGN_BIT_MASK).equal(JLONG_ZERO) ? 1 : -1;
    const exp = bits.shiftRight(new JLong(52)).and(new JLong(0x7FF)).intValue().asJsNumber();
    const mul = exp === 0
        ? bits.and(new JLong(0xFFFFFFFFFFFFFn)).shiftLeft(JLONG_ONE)
        : bits.and(new JLong(0xFFFFFFFFFFFFFn)).or(new JLong(0x10000000000000n));
    return sign * mul.asJsNumber() * (2 ** (exp - 1075));
  }

  public isInfinite(): boolean {
    return this.value === JDOUBLE_INFINITY.value
        || this.value == JDOUBLE_INFINITY_NEGATIVE.value;
  }

  public isNaN(): boolean {
    return this.value >= 0x7FF0000000000001n && this.value <= 0x7FFFFFFFFFFFFFFFn
        || this.value >= 0xFFF0000000000001n && this.value <= 0xFFFFFFFFFFFFFFFFn;
  }

  public compareTo(anotherDouble: JDouble): JInt {
    if (this.lessThan(anotherDouble)) {
      return JINT_ONE_NEGATIVE; // Neither val is NaN, thisVal is smaller
    } else if (anotherDouble.greaterThan(this)) {
      return JINT_ONE; // Neither val is NaN, thisVal is larger
    }

    // Cannot use floatToRawIntBits because of possibility of NaNs.
    const thisBits = this.getLongBits();
    const anotherBits = anotherDouble.getLongBits();

    return thisBits.equal(anotherBits)
        ? JINT_ZERO // values are equal
        : thisBits.lessThan(anotherDouble)
            ? JINT_ONE_NEGATIVE // (-0.0, 0.0) or (!NaN, NaN)
            : JINT_ONE; // (0.0, -0.0) or (NaN, !NaN)
  }

  public getLongBits(): JLong {
    if (this.isNaN()) {
      return new JLong(JDOUBLE_NOT_A_NUMBER.value);
    }
    return this.getRawLongBits();
  }

  public getRawLongBits(): JLong {
    return new JLong(this.value);
  }
}
