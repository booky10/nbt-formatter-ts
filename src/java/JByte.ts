import JNumber from "./JNumber.js";
import JInt, {JINT_ZERO} from "./JInt.js";
import JLong from "./JLong.js";
import JShort from "./JShort.js";

const JS_BITS = 8;

export default class JByte extends JNumber {
  private readonly value: number;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    const limited = BigInt.asIntN(JS_BITS, bigint);
    this.value = Number(limited);
  }

  static parseByte(s: string, radix: number) {
    const i = JInt.parseInt(s, radix);
    if (i.lessThan(JBYTE_MIN_VALUE) || i.greaterThan(JBYTE_MAX_VALUE)) {
      throw new Error(`Value out of range. Value:"${s}" Radix:${radix}`);
    }
    return i.byteValue();
  }

  asJsNumber(): number {
    return this.value;
  }

  asJsBigint(): bigint {
    return BigInt(this.value);
  }

  intValue(): JInt {
    return new JInt(this.value);
  }

  longValue(): JLong {
    return new JLong(this.value);
  }

  byteValue(): JByte {
    return this;
  }

  shortValue(): JShort {
    return new JShort(this.value);
  }

  equal(num: JNumber): boolean {
    return this.value === num.byteValue().value;
  }

  greaterThan(num: JNumber): boolean {
    return this.value > num.byteValue().value;
  }

  greaterThanEqual(num: JNumber): boolean {
    return this.value >= num.byteValue().value;
  }

  lessThan(num: JNumber): boolean {
    return this.value < num.byteValue().value;
  }

  lessThanEqual(num: JNumber): boolean {
    return this.value <= num.byteValue().value;
  }

  plus(num: JNumber): JNumber {
    return new JByte(this.value + num.byteValue().value);
  }

  minus(num: JNumber): JNumber {
    return new JByte(this.value - num.byteValue().value);
  }

  multiply(num: JNumber): JNumber {
    return new JByte(this.value * num.byteValue().value);
  }

  divide(num: JNumber): JNumber {
    if (num.equal(JINT_ZERO)) {
      throw new Error("/ by zero");
    }
    return new JByte(this.value / num.byteValue().value);
  }
}

export const JBYTE_ZERO = new JByte(0);
export const JBYTE_ONE_POSITIVE = new JByte(1);
export const JBYTE_ONE_NEGATIVE = new JByte(-1);
export const JBYTE_MIN_VALUE = new JByte(-128);
export const JBYTE_MAX_VALUE = new JByte(127);
export const JBYTE_SIZE = new JInt(JS_BITS);
export const JBYTE_BYTES = JBYTE_SIZE.divide(JBYTE_SIZE);
