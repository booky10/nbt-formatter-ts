import JNumber from "./JNumber.js";
import {MAX_RADIX, MIN_RADIX} from "../common/util.js";
import JByte, {JBYTE_SIZE} from "./JByte.js";
import JInt, {JINT_SIZE, JINT_ZERO} from "./JInt.js";
import JShort from "./JShort.js";

const JS_BITS = 64;

export default class JLong extends JNumber {
  private readonly value: bigint;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    this.value = BigInt.asIntN(JS_BITS, bigint);
  }

  // copied from java 21's Long#parseLong
  static parseLong(s: string, radix: number) {
    if (s === undefined || s === null) {
      throw new Error("Cannot parse null string");
    } else if (radix < MIN_RADIX) {
      throw new Error(`radix ${radix} less than Character.MIN_RADIX`);
    } else if (radix > MAX_RADIX) {
      throw new Error(`radix ${radix} greater than Character.MAX_RADIX`);
    }

    const error = () =>
        new Error(`For input string: "${s}"${radix === 10 ? "" : ` under radix ${radix}`}`);

    let negative = false;
    let i = JINT_ZERO;
    const len = new JInt(s.length);
    let limit = JLONG_MAX_VALUE.multiply(JLONG_ONE_NEGATIVE);

    if (len.greaterThan(JLONG_ZERO)) {
      const firstChar = s.charAt(0);
      if (firstChar < "0") { // possible leading "+" or "-"
        if (firstChar === "-") {
          negative = true;
          limit = JLONG_MIN_VALUE;
        } else if (firstChar !== "+") {
          throw error();
        }
        if (len.equal(JLONG_ONE_POSITIVE)) { // cannot have lone "+" or "-"
          throw error();
        }
        i = i.plus(JLONG_ONE_POSITIVE).intValue();
      }
      const jradix = new JInt(radix);
      const multmin = limit.divide(jradix);
      let result = JLONG_ZERO;
      while (i.lessThan(len)) {
        // accumulating negatively avoids surprises near MAX_VALUE
        const digit = new JInt(parseInt(s.charAt(i.asJsNumber()), radix));
        if (digit.lessThan(JINT_ZERO) || result.lessThan(multmin)) {
          throw error();
        }
        result = result.multiply(jradix).longValue();
        if (result.lessThan(limit.plus(digit))) {
          throw error();
        }
        result = result.minus(digit).longValue();
      }
      return negative ? result : result.multiply(JLONG_ONE_NEGATIVE);
    } else {
      throw error();
    }
  }

  asJsNumber(): number {
    // limit to 32 bit to prevent javascript from cutting off stuff
    return Number(BigInt.asIntN(JINT_SIZE.asJsNumber(), this.value));
  }

  asJsBigint(): bigint {
    return this.value;
  }

  intValue(): JInt {
    return new JInt(this.value);
  }

  longValue(): JLong {
    return this;
  }

  byteValue(): JByte {
    return new JByte(this.value);
  }

  shortValue(): JShort {
    return new JShort(this.value);
  }

  equal(num: JNumber): boolean {
    return this.value === num.longValue().value;
  }

  greaterThan(num: JNumber): boolean {
    return this.value > num.longValue().value;
  }

  greaterThanEqual(num: JNumber): boolean {
    return this.value >= num.longValue().value;
  }

  lessThan(num: JNumber): boolean {
    return this.value < num.longValue().value;
  }

  lessThanEqual(num: JNumber): boolean {
    return this.value <= num.longValue().value;
  }

  plus(num: JNumber): JNumber {
    return new JLong(this.value + num.longValue().value);
  }

  minus(num: JNumber): JNumber {
    return new JLong(this.value - num.longValue().value);
  }

  multiply(num: JNumber): JNumber {
    return new JLong(this.value * num.longValue().value);
  }

  divide(num: JNumber): JNumber {
    if (num.equal(JINT_ZERO)) {
      throw new Error("/ by zero");
    }
    return new JLong(this.value / num.longValue().value);
  }
}

export const JLONG_ZERO = new JLong(0);
export const JLONG_ONE_POSITIVE = new JLong(1);
export const JLONG_ONE_NEGATIVE = new JLong(-1);
export const JLONG_MIN_VALUE = new JLong(0x80000000);
export const JLONG_MAX_VALUE = new JLong(0x7FFFFFFF);
export const JLONG_SIZE = new JInt(JS_BITS);
export const JLONG_BYTES = JLONG_SIZE.divide(JBYTE_SIZE);
