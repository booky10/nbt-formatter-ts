import JInt from "./JInt.js";
import JByte from "./JByte.js";

export default abstract class JNumber {

  public abstract intValue(): JInt;

  public abstract longValue(): JLong;

  public abstract floatValue(): JFloat;

  public abstract doubleValue(): JDouble;

  public abstract byteValue(): JByte;

  public abstract shortValue(): JShort;
}
