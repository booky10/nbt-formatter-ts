import JNumber from "./JNumber.js";
import {JBYTE_SIZE} from "./JByte.js";
import JInt, {JINT_ONE_NEGATIVE, JINT_ONE, JINT_ZERO} from "./JInt.js";
import JLong, {JLONG_ONE, JLONG_ZERO} from "./JLong.js";
import {parseDouble} from "./JFloatingDecimal.js";

const JS_BITS = 64;
const DEF_NAN = 0x7FF8000000000000n;
const INFIN_POS = 0x7FF0000000000000n;
const INFIN_NEG = 0xFFF0000000000000n;

export default class JDouble extends JNumber {
    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        const bigint = BigInt(value);
        this.value = BigInt.asUintN(JS_BITS, bigint);
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
        return this.value === INFIN_POS || this.value == INFIN_NEG;
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
            return new JLong(DEF_NAN);
        }
        return this.getRawLongBits();
    }

    public getRawLongBits(): JLong {
        return new JLong(this.value);
    }
}

export const JDOUBLE_ZERO = JDouble.fromRawLongBits(0n);
export const JDOUBLE_ZERO_NEGATIVE = JDouble.fromRawLongBits(0x8000000000000000n);
export const JDOUBLE_ONE = JDouble.fromRawLongBits(0x3FF0000000000000n);
export const JDOUBLE_ONE_NEGATIVE = JDouble.fromRawLongBits(0xBFF0000000000000n);
export const JDOUBLE_TWO_POSITIVE = JDouble.fromRawLongBits(0x4000000000000000n);
export const JDOUBLE_INFINITY = JDouble.fromRawLongBits(INFIN_POS);
export const JDOUBLE_INFINITY_NEGATIVE = JDouble.fromRawLongBits(INFIN_NEG);
export const JDOUBLE_NOT_A_NUMBER = JDouble.fromRawLongBits(DEF_NAN);
export const JDOUBLE_MIN_VALUE = JDouble.fromRawLongBits(1n);
export const JDOUBLE_MAX_VALUE = JDouble.fromRawLongBits(0x7FEFFFFFFFFFFFFFn);
export const JDOUBLE_SIZE = new JInt(JS_BITS);
export const JDOUBLE_PRECISION = new JInt(53);
export const JDOUBLE_MAX_EXPONENT = JINT_ONE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION).minus(JINT_ONE)).minus(JINT_ONE); // 1023
export const JDOUBLE_MIN_EXPONENT = JINT_ONE.minus(JDOUBLE_MAX_EXPONENT); // -1022
export const JDOUBLE_BYTES = JDOUBLE_SIZE.divide(JBYTE_SIZE);

export const JDOUBLE_SIGN_BIT_MASK = JLONG_ONE.shiftLeft(JDOUBLE_SIZE.minus(JINT_ONE)).longValue();
export const JDOUBLE_EXP_BIT_MASK = JLONG_ONE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION)).minus(JINT_ONE)
    .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE_NEGATIVE)).longValue();
export const JDOUBLE_MIN_SUB_EXPONENT = JDOUBLE_MIN_EXPONENT.minus(JDOUBLE_PRECISION.minus(JINT_ONE)).intValue(); // -1074
export const JDOUBLE_EXP_BIAS = JINT_ONE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION)
    .minus(JINT_ONE)).minus(JINT_ONE).intValue(); // 1023
export const JDOUBLE_SIGNIF_BIT_MASK = JLONG_ONE.shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE)).minus(JINT_ONE).longValue();
