import JInt from "./JInt.js";

export default class JMath {
  private constructor() {
  }

  public static max(a: JInt, b: JInt): JInt {
    return a.greaterThanEqual(b) ? a : b
  }

  public static min(a: JInt, b: JInt): JInt {
    return a.lessThanEqual(b) ? a : b;
  }
}
