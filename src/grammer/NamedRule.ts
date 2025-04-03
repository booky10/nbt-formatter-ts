import Atom from "./Atom.js";
import Rule from "./Rule.js";

export default interface NamedRule<S, T> {
  getName(): Atom<T>;

  getValue(): Rule<S, T>;
}
