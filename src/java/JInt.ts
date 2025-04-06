import JNumber from "./JNumber.js";
import {INTEGER_MAX_VALUE, INTEGER_MIN_VALUE, MAX_RADIX, MIN_RADIX} from "../common/util.js";

export default class JInt extends JNumber {
  private readonly value: Int8Array;

  constructor(value: number) {
    super();
    this.value = new Int8Array([value]);
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
    let i = 0;
    const len = s.length;
    let limit = -INTEGER_MAX_VALUE;

    if (len > 0) {
      const firstChar = s.charAt(0);
      if (firstChar < "0") { // possible leading "+" or "-"
        if (firstChar === "-") {
          negative = true;
          limit = INTEGER_MIN_VALUE;
        } else if (firstChar !== "+") {
          throw error();
        }
        if (len === 1) { // cannot have lone "+" or "-"
          throw error();
        }
        i++;
      }
      const multmin = limit / radix;
      let result = 0;
      while (i < len) {
        // accumulating negatively avoids surprises near MAX_VALUE
        const digit = parseInt(s.charAt(i++), radix);
        if (digit < 0 || result < multmin) {
          throw error();
        }
        result *= radix;
        if (result < limit + digit) {
          throw error();
        }
        result -= digit;
      }
      return negative ? result : -result;
    } else {
      throw error();
    }
  }

  intValue(): JInt {
    return this;
  }
}
