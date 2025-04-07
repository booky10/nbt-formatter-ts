import JInt from "./JInt.js";
import JByte from "./JByte.js";
import JDouble from "./JDouble.js";
import JFloat from "./JFloat.js";
import JShort from "./JShort.js";
import JLong from "./JLong.js";

// byte
export const JBYTE_ZERO = new JByte(0);
export const JBYTE_ONE_POSITIVE = new JByte(1);
export const JBYTE_ONE_NEGATIVE = new JByte(-1);
export const JBYTE_MIN_VALUE = new JByte(-128);
export const JBYTE_MAX_VALUE = new JByte(127);
export const JBYTE_SIZE = new JInt(8);
export const JBYTE_BYTES = JBYTE_SIZE.divide(JBYTE_SIZE);

// short
export const JSHORT_ZERO = new JShort(0);
export const JSHORT_ONE_POSITIVE = new JShort(1);
export const JSHORT_ONE_NEGATIVE = new JShort(-1);
export const JSHORT_MIN_VALUE = new JShort(-128);
export const JSHORT_MAX_VALUE = new JShort(127);
export const JSHORT_SIZE = new JInt(16);
export const JSHORT_BYTES = JSHORT_SIZE.divide(JBYTE_SIZE);

// int
export const JINT_ONE_NEGATIVE = new JInt(-1);
export const JINT_ZERO = new JInt(0);
export const JINT_ONE = new JInt(1);
export const JINT_TWO = new JInt(2);
export const JINT_FOUR = new JInt(4);
export const JINT_EIGHT = new JInt(8);
export const JINT_TEN = new JInt(10);
export const JINT_SIXTEEN = new JInt(16);
export const JINT_MIN_VALUE = new JInt(0x80000000);
export const JINT_MAX_VALUE = new JInt(0x7FFFFFFF);
export const JINT_SIZE = new JInt(32);
export const JINT_BYTES = JINT_SIZE.divide(JBYTE_SIZE);

// long
export const JLONG_ONE_NEGATIVE = new JLong(-1);
export const JLONG_ZERO = new JLong(0);
export const JLONG_ONE = new JLong(1);
export const JLONG_TEN = new JLong(10);
export const JLONG_MIN_VALUE = new JLong(0x80000000);
export const JLONG_MAX_VALUE = new JLong(0x7FFFFFFF);
export const JLONG_SIZE = new JInt(64);
export const JLONG_BYTES = JLONG_SIZE.divide(JBYTE_SIZE);

// float
export const JFLOAT_ZERO = JFloat.fromRawIntBits(0n);
export const JFLOAT_ZERO_NEGATIVE = JFloat.fromRawIntBits(0x80000000n);
export const JFLOAT_ONE = JFloat.fromRawIntBits(0x3F800000n);
export const JFLOAT_ONE_NEGATIVE = JFloat.fromRawIntBits(0xBF800000n);
export const JFLOAT_INFINITY = JFloat.fromRawIntBits(0x7F800000n);
export const JFLOAT_INFINITY_NEGATIVE = JFloat.fromRawIntBits(0xFF800000n);
export const JFLOAT_NOT_A_NUMBER = JFloat.fromRawIntBits(0x7FC00000n);
export const JFLOAT_MIN_VALUE = JFloat.fromRawIntBits(1n);
export const JFLOAT_MAX_VALUE = JFloat.fromRawIntBits(0x7F7FFFFFn);
export const JFLOAT_SIZE = new JInt(32);
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

// double
export const JDOUBLE_ZERO = JDouble.fromRawLongBits(0n);
export const JDOUBLE_ZERO_NEGATIVE = JDouble.fromRawLongBits(0x8000000000000000n);
export const JDOUBLE_ONE = JDouble.fromRawLongBits(0x3FF0000000000000n);
export const JDOUBLE_ONE_NEGATIVE = JDouble.fromRawLongBits(0xBFF0000000000000n);
export const JDOUBLE_TWO_POSITIVE = JDouble.fromRawLongBits(0x4000000000000000n);
export const JDOUBLE_INFINITY = JDouble.fromRawLongBits(0x7FF0000000000000n);
export const JDOUBLE_INFINITY_NEGATIVE = JDouble.fromRawLongBits(0xFFF0000000000000n);
export const JDOUBLE_NOT_A_NUMBER = JDouble.fromRawLongBits(0x7FF8000000000000n);
export const JDOUBLE_MIN_VALUE = JDouble.fromRawLongBits(1n);
export const JDOUBLE_MAX_VALUE = JDouble.fromRawLongBits(0x7FEFFFFFFFFFFFFFn);
export const JDOUBLE_SIZE = new JInt(64);
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
