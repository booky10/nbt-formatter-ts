import JNumber from "./JNumber.js";
import JInt from "./JInt.js";
import JLong from "./JLong.js";
import JShort from "./JShort.js";
import {JBYTE_MAX_VALUE, JBYTE_MIN_VALUE, JBYTE_SIZE, JINT_ZERO} from "./NumberConstants.js";

export default class JByte extends JNumber {
  private readonly value: number;

  constructor(value: bigint | number) {
    super();
    const bigint = BigInt(value);
    const limited = BigInt.asIntN(JBYTE_SIZE.asJsNumber(), bigint);
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
