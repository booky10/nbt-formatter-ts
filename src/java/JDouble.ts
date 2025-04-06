import JNumber from "./JNumber.js";
import {JBYTE_SIZE} from "./JByte.js";
import JInt, {JINT_ONE_NEGATIVE, JINT_ONE_POSITIVE} from "./JInt.js";
import {JLONG_ONE_POSITIVE} from "./JLong.js";

const JS_BITS = 64;

export default class JDouble extends JNumber {
    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        const bigint = BigInt(value);
        this.value = BigInt.asIntN(JS_BITS, bigint);
    }

    static fromRawLongBits(bits: bigint | JNumber) {
        if (bits instanceof JNumber) {
            bits = bits.asJsBigint();
        }
        return new JDouble(bits);
    }
}

export const JDOUBLE_ZERO_POSITIVE = JDouble.fromRawLongBits(0n);
export const JDOUBLE_ZERO_NEGATIVE = JDouble.fromRawLongBits(0x8000000000000000n);
export const JDOUBLE_ONE_POSITIVE = JDouble.fromRawLongBits(0x3FF0000000000000n);
export const JDOUBLE_ONE_NEGATIVE = JDouble.fromRawLongBits(0xBFF0000000000000n);
export const JDOUBLE_INFINITY_POSITIVE = JDouble.fromRawLongBits(0x7FF0000000000000n);
export const JDOUBLE_INFINITY_NEGATIVE = JDouble.fromRawLongBits(0xFFF0000000000000n);
export const JDOUBLE_NOT_A_NUMBER = JDouble.fromRawLongBits(0x7FF8000000000000n);
export const JDOUBLE_MIN_VALUE = JDouble.fromRawLongBits(1n);
export const JDOUBLE_MAX_VALUE = JDouble.fromRawLongBits(0x7FEFFFFFFFFFFFFFn);
export const JDOUBLE_SIZE = new JInt(JS_BITS);
export const JDOUBLE_PRECISION = new JInt(53);
export const JDOUBLE_MAX_EXPONENT = JINT_ONE_POSITIVE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION).minus(JINT_ONE_POSITIVE)).minus(JINT_ONE_POSITIVE); // 1023
export const JDOUBLE_MIN_EXPONENT = JINT_ONE_POSITIVE.minus(JDOUBLE_MAX_EXPONENT); // -1022
export const JDOUBLE_BYTES = JDOUBLE_SIZE.divide(JBYTE_SIZE);

export const JDOUBLE_SIGN_BIT_MASK = JLONG_ONE_POSITIVE.shiftLeft(JDOUBLE_SIZE.minus(JINT_ONE_POSITIVE));
export const JDOUBLE_EXP_BIT_MASK = JLONG_ONE_POSITIVE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION)).minus(JINT_ONE_POSITIVE)
    .shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE_NEGATIVE));
export const JDOUBLE_MIN_SUB_EXPONENT = JDOUBLE_MIN_EXPONENT.minus(JDOUBLE_PRECISION.minus(JINT_ONE_POSITIVE)); // -1074
export const JDOUBLE_EXP_BIAS = JINT_ONE_POSITIVE.shiftLeft(JDOUBLE_SIZE.minus(JDOUBLE_PRECISION)
    .minus(JINT_ONE_POSITIVE)).minus(JINT_ONE_POSITIVE); // 1023
export const JDOUBLE_SIGNIF_BIT_MASK = JLONG_ONE_POSITIVE.shiftLeft(JDOUBLE_PRECISION.minus(JINT_ONE_POSITIVE)).minus(JINT_ONE_POSITIVE);
