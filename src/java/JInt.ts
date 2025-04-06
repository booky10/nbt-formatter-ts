import JNumber from "./JNumber.js";
import {MAX_RADIX, MIN_RADIX} from "../common/util.js";
import JByte, {JBYTE_SIZE} from "./JByte.js";
import JLong from "./JLong.js";
import JShort from "./JShort.js";

const JS_BITS = 32;

export default class JInt extends JNumber {
  private readonly value: number;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    const limited = BigInt.asIntN(JS_BITS, bigint);
    this.value = Number(limited);
  }

  // copied from java 21's Integer#parseInt
  static parseInt(s: string, radix: number) {
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
    let limit = JINT_MAX_VALUE.multiply(JINT_ONE_NEGATIVE);

    if (len.greaterThan(JINT_ZERO)) {
      const firstChar = s.charAt(0);
      if (firstChar < "0") { // possible leading "+" or "-"
        if (firstChar === "-") {
          negative = true;
          limit = JINT_MIN_VALUE;
        } else if (firstChar !== "+") {
          throw error();
        }
        if (len.equal(JINT_ONE_POSITIVE)) { // cannot have lone "+" or "-"
          throw error();
        }
        i = i.plus(JINT_ONE_POSITIVE).intValue();
      }
      const jradix = new JInt(radix);
      const multmin = limit.divide(jradix);
      let result = JINT_ZERO;
      while (i.lessThan(len)) {
        // accumulating negatively avoids surprises near MAX_VALUE
        const digit = new JInt(parseInt(s.charAt(i.asJsNumber()), radix));
        if (digit.lessThan(JINT_ZERO) || result.lessThan(multmin)) {
          throw error();
        }
        result = result.multiply(jradix).intValue();
        if (result.lessThan(limit.plus(digit))) {
          throw error();
        }
        result = result.minus(digit).intValue();
      }
      return negative ? result : result.multiply(JINT_ONE_NEGATIVE);
    } else {
      throw error();
    }
  }

  asJsNumber(): number {
    return this.value;
  }

  asJsBigint(): bigint {
    return BigInt(this.value);
  }

  intValue(): JInt {
    return this;
  }

  longValue(): JLong {
    return new JLong(this.value);
  }

  byteValue(): JByte {
    return new JByte(this.value);
  }

  shortValue(): JShort {
    return new JShort(this.value);
  }

  equal(num: JNumber): boolean {
    return this.value === num.intValue().value;
  }

  greaterThan(num: JNumber): boolean {
    return this.value > num.intValue().value;
  }

  greaterThanEqual(num: JNumber): boolean {
    return this.value >= num.intValue().value;
  }

  lessThan(num: JNumber): boolean {
    return this.value < num.intValue().value;
  }

  lessThanEqual(num: JNumber): boolean {
    return this.value <= num.intValue().value;
  }

  plus(num: JNumber): JNumber {
    return new JInt(this.value + num.intValue().value);
  }

  minus(num: JNumber): JNumber {
    return new JInt(this.value - num.intValue().value);
  }

  multiply(num: JNumber): JNumber {
    return new JInt(this.value * num.intValue().value);
  }

  divide(num: JNumber): JNumber {
    if (num.equal(JINT_ZERO)) {
      throw new Error("/ by zero");
    }
    return new JInt(this.value / num.intValue().value);
  }
}

export const JINT_ZERO = new JInt(0);
export const JINT_ONE_POSITIVE = new JInt(1);
export const JINT_ONE_NEGATIVE = new JInt(-1);
export const JINT_TEN_POSITIVE = new JInt(10);
export const JINT_MIN_VALUE = new JInt(0x80000000);
export const JINT_MAX_VALUE = new JInt(0x7FFFFFFF);
export const JINT_SIZE = new JInt(JS_BITS);
export const JINT_BYTES = JINT_SIZE.divide(JBYTE_SIZE);
