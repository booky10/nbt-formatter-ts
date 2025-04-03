import ParseState from "./ParseState.js";
import Scope from "./Scope.js";
import Control from "./Control.js";

export interface Term<S> {
  parse(state: ParseState<S>, scope: Scope, control: Control): boolean;
}

// TODO
