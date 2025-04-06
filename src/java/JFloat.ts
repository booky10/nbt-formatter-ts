import JNumber from "./JNumber.js";
import {JBYTE_SIZE} from "./JByte.js";
import JInt from "./JInt.js";

const JS_BITS = 32;

export default class JFloat extends JNumber {
    private readonly value: bigint;

    private constructor(value: bigint) {
        super();
        const bigint = BigInt(value);
        this.value = BigInt.asIntN(JS_BITS, bigint);
    }

    static fromRawIntBits(bits: bigint | JNumber) {
        if (bits instanceof JNumber) {
            bits = bits.asJsBigint();
        }
        return new JFloat(bits);
    }
}

export const JFLOAT_ZERO_POSITIVE = JFloat.fromRawIntBits(0n);
export const JFLOAT_ZERO_NEGATIVE = JFloat.fromRawIntBits(0x80000000n);
export const JFLOAT_ONE_POSITIVE = JFloat.fromRawIntBits(0x3F800000n);
export const JFLOAT_ONE_NEGATIVE = JFloat.fromRawIntBits(0xBF800000n);
export const JFLOAT_INFINITY_POSITIVE = JFloat.fromRawIntBits(0x7F800000n);
export const JFLOAT_INFINITY_NEGATIVE = JFloat.fromRawIntBits(0xFF800000n);
export const JFLOAT_NOT_A_NUMBER = JFloat.fromRawIntBits(0x7FC00000n);
export const JFLOAT_MIN_VALUE = JFloat.fromRawIntBits(1n);
export const JFLOAT_MAX_VALUE = JFloat.fromRawIntBits(0x7F7FFFFFn);
export const JFLOAT_SIZE = new JInt(JS_BITS);
export const JFLOAT_BYTES = JFLOAT_SIZE.divide(JBYTE_SIZE);
