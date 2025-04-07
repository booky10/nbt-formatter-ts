import JNumber from "./JNumber.js";
import {MAX_RADIX, MIN_RADIX} from "../common/util.js";
import JByte from "./JByte.js";
import JLong from "./JLong.js";
import JShort from "./JShort.js";
import {
  JINT_EIGHT,
  JINT_FOUR,
  JINT_MAX_VALUE,
  JINT_MIN_VALUE,
  JINT_ONE,
  JINT_ONE_NEGATIVE,
  JINT_SIXTEEN,
  JINT_SIZE, JINT_TWO,
  JINT_ZERO,
} from "./NumberConstants.js";

export default class JInt extends JNumber {
  private readonly uvalue: bigint;
  private readonly svalue: bigint;
  private readonly value: number;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    this.uvalue = BigInt.asUintN(JINT_SIZE.asJsNumber(), bigint);
    this.svalue = BigInt.asIntN(JINT_SIZE.asJsNumber(), bigint);
    this.value = Number(this.svalue);
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
    return this.svalue;
  }

  asString(): string {
    return this.svalue.toString(10);
  }

  asHexString(): string {
    return this.uvalue.toString(16);
  }

  intValue(): JInt {
    return this;
  }

  longValue(): JLong {
    return new JLong(this.svalue);
  }

  byteValue(): JByte {
    return new JByte(this.svalue);
  }

  shortValue(): JShort {
    return new JShort(this.svalue);
  }

  equal(num: JNumber): boolean {
    return this.uvalue === num.intValue().uvalue;
  }

  greaterThan(num: JNumber): boolean {
    return this.svalue > num.intValue().svalue;
  }

  greaterThanEqual(num: JNumber): boolean {
    return this.svalue >= num.intValue().svalue;
  }

  lessThan(num: JNumber): boolean {
    return this.svalue < num.intValue().svalue;
  }

  lessThanEqual(num: JNumber): boolean {
    return this.svalue <= num.intValue().svalue;
  }

  plus(num: JNumber): JNumber {
    return new JInt(this.svalue + num.intValue().svalue);
  }

  minus(num: JNumber): JNumber {
    return new JInt(this.svalue - num.intValue().svalue);
  }

  multiply(num: JNumber): JNumber {
    return new JInt(this.svalue * num.intValue().svalue);
  }

  divide(num: JNumber): JNumber {
    if (num.equal(JINT_ZERO)) {
      throw new Error("/ by zero");
    }
    return new JInt(this.svalue / num.intValue().svalue);
  }

  or(num: JNumber): JNumber {
    return new JInt(this.uvalue | num.intValue().uvalue);
  }

  and(num: JNumber): JNumber {
    return new JInt(this.uvalue & num.intValue().uvalue);
  }

  not(): JNumber {
    return new JInt(~this.svalue);
  }

  shiftLeft(bits: JNumber): JNumber {
    // TODO broken behavior for negative values
    // TODO broken behavior for out-of-bounds
    return new JInt(this.svalue << bits.intValue().svalue);
  }

  shiftRight(bits: JNumber): JNumber {
    // TODO broken behavior for negative values
    // TODO broken behavior for out-of-bounds
    return new JInt(this.svalue >> bits.intValue().svalue);
  }

  unsignedShiftRight(bits: JNumber): JNumber {
    // TODO broken behavior for negative values
    // TODO broken behavior for out-of-bounds
    return new JInt(this.uvalue >> bits.intValue().svalue);
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
