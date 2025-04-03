import Scope from "./Scope.js";
import NamedRule from "./NamedRule.js";
import Control from "./Control.js";
import ErrorCollector from "./ErrorCollector.js";

export default interface ParseState<S> {

  getScope(): Scope;

  getErrorCollector(): ErrorCollector<S>;

  parseTopRule<T>(rule: NamedRule<S, T>): T | undefined;

  parse<T>(rule: NamedRule<S, T>): T | undefined;

  getInput(): S;

  mark(): number;

  restore(cursor: number): void;

  acquireControl(): Control;

  releaseControl(): void;

  asSilent(): ParseState<S>;
}
