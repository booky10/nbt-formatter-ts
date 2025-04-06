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
  static parseInt(s: string, radix: number = 10) {
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
        if (len.equal(JINT_ONE)) { // cannot have lone "+" or "-"
          throw error();
        }
        i = i.plus(JINT_ONE).intValue();
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

  public numberOfLeadingZeros(): JInt {
    // HD, Count leading 0's
    let i = this.intValue();
    if (i.lessThanEqual(JINT_ZERO)) {
      return i.equal(JINT_ZERO) ? new JInt(32) : JINT_ZERO;
    }
    let n = new JInt(31);
    if (i.greaterThanEqual(JINT_ONE.shiftLeft(JINT_SIXTEEN))) {
      n = n.minus(JINT_SIXTEEN).intValue();
      i = i.unsignedShiftRight(JINT_SIXTEEN).intValue();
    }
    if (i.greaterThanEqual(JINT_ONE.shiftLeft(JINT_EIGHT))) {
      n = n.minus(JINT_EIGHT).intValue();
      i = i.unsignedShiftRight(JINT_EIGHT).intValue();
    }
    if (i.greaterThanEqual(JINT_ONE.shiftLeft(JINT_FOUR))) {
      n = n.minus(JINT_FOUR).intValue();
      i = i.unsignedShiftRight(JINT_FOUR).intValue();
    }
    if (i.greaterThanEqual(JINT_ONE.shiftLeft(JINT_TWO))) {
      n = n.minus(JINT_TWO).intValue();
      i = i.unsignedShiftRight(JINT_TWO).intValue();
    }
    return n.minus(i.unsignedShiftRight(JINT_ONE)).intValue();
  }

  public numberOfTrailingZeros(): JInt {
    // HD, Count trailing 0's
    let i = this.not().and(this.minus(JINT_ONE)).intValue();
    if (i.lessThanEqual(JINT_ZERO)) {
      return i.and(new JInt(32)).intValue();
    }
    let n = JINT_ONE;
    if (i.greaterThan(JINT_ONE.shiftLeft(JINT_SIXTEEN))) {
      n = n.plus(JINT_SIXTEEN).intValue();
      i = i.unsignedShiftRight(JINT_SIXTEEN).intValue();
    }
    if (i.greaterThan(JINT_ONE.shiftLeft(JINT_EIGHT))) {
      n = n.plus(JINT_EIGHT).intValue();
      i = i.unsignedShiftRight(JINT_EIGHT).intValue();
    }
    if (i.greaterThan(JINT_ONE.shiftLeft(JINT_FOUR))) {
      n = n.plus(JINT_FOUR).intValue();
      i = i.unsignedShiftRight(JINT_FOUR).intValue();
    }
    if (i.greaterThan(JINT_ONE.shiftLeft(JINT_TWO))) {
      n = n.plus(JINT_TWO).intValue();
      i = i.unsignedShiftRight(JINT_TWO).intValue();
    }
    return n.plus(i.unsignedShiftRight(JINT_ONE)).intValue();
  }
}

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
export const JINT_SIZE = new JInt(JS_BITS);
export const JINT_BYTES = JINT_SIZE.divide(JBYTE_SIZE);
