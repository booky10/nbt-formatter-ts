import JInt, {JINT_ZERO} from "./JInt.js";
import JFloat, {JFLOAT_ZERO, JFLOAT_ZERO_NEGATIVE} from "./JFloat.js";

export default class JMath {
  private constructor() {
  }

  public static imax(a: JInt, b: JInt): JInt {
    return a.greaterThanEqual(b) ? a : b;
  }

  public static fmax(a: JFloat, b: JFloat): JFloat {
    if (!a.equal(a)) {
      return a; // a is NaN
    }
    if (a.equal(JFLOAT_ZERO) && b.equal(JFLOAT_ZERO) &&
        a.getRawIntBits().equal(JFLOAT_ZERO_NEGATIVE.getRawIntBits())) {
      // Raw conversion ok since NaN can't map to -0.0.
      return b;
    }
    return a.greaterThanEqual(b) ? a : b;
  }

  public static imin(a: JInt, b: JInt): JInt {
    return a.lessThanEqual(b) ? a : b;
  }

  public static fmin(a: JFloat, b: JFloat): JFloat {
    if (!a.equal(a)) {
      return a; // a is NaN
    }
    if (a.equal(JFLOAT_ZERO) && b.equal(JFLOAT_ZERO) &&
        b.getRawIntBits().equal(JFLOAT_ZERO_NEGATIVE.getRawIntBits())) {
      // Raw conversion ok since NaN can't map to -0.0.
      return b;
    }
    return a.lessThanEqual(b) ? a : b;
  }

  public static fclamp(value: JFloat, min: JFloat, max: JFloat): JFloat {
    // This unusual condition allows keeping only one branch
    // on common path when min < max and neither of them is NaN.
    // If min == max, we should additionally check for +0.0/-0.0 case,
    // so we're still visiting the if statement.
    if (!min.lessThan(max)) { // min greater than, equal to, or unordered with respect to max; NaN values are unordered
      if (min.isNaN()) {
        throw new Error("min is NaN");
      } else if (max.isNaN()) {
        throw new Error("max is NaN");
      } else if (min.compareTo(max).greaterThan(JINT_ZERO)) {
        throw new Error(`${min} > ${max}`);
      }
      // Fall-through if min and max are exactly equal (or min = -0.0 and max = +0.0)
      // and none of them is NaN
    }
    return JMath.fmin(max, JMath.fmax(value, min));
  }
}
