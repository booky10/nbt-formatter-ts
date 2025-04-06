import JNumber from "./JNumber.js";
import JInt, {JINT_ZERO} from "./JInt.js";
import JLong from "./JLong.js";
import JByte from "./JByte.js";

const JS_BITS = 16;

export default class JShort extends JNumber {
  private readonly value: number;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    const limited = BigInt.asIntN(JS_BITS, bigint);
    this.value = Number(limited);
  }

  static parseLong(s: string, radix: number) {
    const i = JInt.parseInt(s, radix);
    if (i.lessThan(JSHORT_MIN_VALUE) || i.greaterThan(JSHORT_MAX_VALUE)) {
      throw new Error(`Value out of range. Value:"${s}" Radix:${radix}`);
    }
    return i.shortValue();
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
    return new JByte(this.value);
  }

  shortValue(): JShort {
    return this;
  }

  equal(num: JNumber): boolean {
    return this.value === num.shortValue().value;
  }

  greaterThan(num: JNumber): boolean {
    return this.value > num.shortValue().value;
  }

  lessThan(num: JNumber): boolean {
    return this.value < num.shortValue().value;
  }

  plus(num: JNumber): JNumber {
    return new JShort(this.value + num.shortValue().value);
  }

  minus(num: JNumber): JNumber {
    return new JShort(this.value - num.shortValue().value);
  }

  multiply(num: JNumber): JNumber {
    return new JShort(this.value * num.shortValue().value);
  }

  divide(num: JNumber): JNumber {
    if (num.equal(JINT_ZERO)) {
      throw new Error("/ by zero");
    }
    return new JShort(this.value / num.shortValue().value);
  }
}

export const JSHORT_ZERO = new JShort(0);
export const JSHORT_ONE_POSITIVE = new JShort(1);
export const JSHORT_ONE_NEGATIVE = new JShort(-1);
export const JSHORT_MIN_VALUE = new JShort(-128);
export const JSHORT_MAX_VALUE = new JShort(127);
export const JSHORT_SIZE = new JInt(JS_BITS);
export const JSHORT_BYTES = JSHORT_SIZE.divide(JSHORT_SIZE);
