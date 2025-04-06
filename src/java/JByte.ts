import JNumber from "./JNumber.js";
import JInt from "./JInt.js";

const MIN_VALUE = -128;
const MAX_VALUE = 127;

export default class JByte extends JNumber {
  private readonly value: Int8Array;

  constructor(value: number) {
    super();
    this.value = new Int8Array([value]);
  }

  static parseByte(s: string, radix: number) {
    const i = JInt.parseInt(s, radix);
    if (i < MIN_VALUE || i > MAX_VALUE) {
      throw new Error(`Value out of range. Value:"${s}" Radix:${radix}`);
    }
    return new JByte(i);
  }

  byteValue(): JByte {
    return this;
  }
}
