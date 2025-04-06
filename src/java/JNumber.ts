import JInt from "./JInt.js";
import JByte from "./JByte.js";
import JLong from "./JLong.js";
import JShort from "./JShort.js";
import JFloat from "./JFloat.js";
import JDouble from "./JDouble.js";

export default abstract class JNumber {

  public abstract asJsNumber(): number

  public abstract asJsBigint(): bigint

  public abstract intValue(): JInt;

  public abstract longValue(): JLong;

  public abstract floatValue(): JFloat;

  public abstract doubleValue(): JDouble;

  public abstract byteValue(): JByte;

  public abstract shortValue(): JShort;

  public abstract equal(num: JNumber): boolean;

  public abstract greaterThan(num: JNumber): boolean;

  public abstract greaterThanEqual(num: JNumber): boolean;

  public abstract lessThan(num: JNumber): boolean;

  public abstract lessThanEqual(num: JNumber): boolean;

  public abstract plus(num: JNumber): JNumber;

  public abstract minus(num: JNumber): JNumber;

  public abstract multiply(num: JNumber): JNumber;

  public abstract divide(num: JNumber): JNumber;
}
