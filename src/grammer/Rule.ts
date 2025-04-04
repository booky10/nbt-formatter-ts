import ParseState from "./ParseState.js";
import {Term} from "./Term.js";
import {ControlUnbound} from "./Control.js";

export default interface Rule<S, T> {
  parse(state: ParseState<S>): T | undefined;
}

export const ruleFromTerm = <S, T>(child: Term<S>, action: RuleAction<S, T> | SimpleRuleAction<S, T>): Rule<S, T> => {
  return new WrappedTerms<S, T>(action, child);
};

export interface RuleAction<S, T> {
  run(state: ParseState<S>): T | undefined;
}

export interface SimpleRuleAction<S, T> extends RuleAction<S, T> {
  run(state: ParseState<S>): T;
}

export class WrappedTerms<S, T> implements Rule<S, T> {
  private readonly action: RuleAction<S, T>;
  private readonly child: Term<S>;

  constructor(action: RuleAction<S, T>, child: Term<S>) {
    this.action = action;
    this.child = child;
  }

  public parse(state: ParseState<S>): T | undefined {
    const scope = state.getScope();
    scope.pushFrame();

    let object: T;
    try {
      if (!this.child.parse(state, scope, ControlUnbound)) {
        return undefined;
      }
      object = this.action.run(state);
    } finally {
      scope.popFrame();
    }
    return object;
  }
}
