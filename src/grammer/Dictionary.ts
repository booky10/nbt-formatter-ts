import Atom from "./Atom.js";
import NamedRule from "./NamedRule.js";
import Rule, {RuleAction, ruleFromTerm, SimpleRuleAction} from "./Rule.js";
import Supplier from "./Supplier.js";
import {Term} from "./Term.js";
import ParseState from "./ParseState.js";
import Scope from "./Scope.js";
import Control from "./Control.js";

export default class Dictionary<S> {
  private readonly terms: Map<Atom<any>, DictionaryEntry<S, any>> = new Map();

  public put<T>(name: Atom<T>, rule: Rule<S, T>): NamedRule<S, T> {
    let entry = this.terms.get(name);
    if (entry == null) {
      entry = new DictionaryEntry<S, any>(name);
      this.terms.set(name, entry);
    }
    if (entry.value) {
      throw new Error("Trying to override rule: " + name);
    }
    entry.value = rule;
    return entry;
  }

  public putComplex<T>(name: Atom<T>, term: Term<S>, ruleAction: RuleAction<S, T>) {
    return this.put(name, ruleFromTerm(term, ruleAction));
  }

  public putSimple<T>(name: Atom<T>, term: Term<S>, ruleAction: SimpleRuleAction<S, T>) {
    return this.put(name, ruleFromTerm(term, ruleAction));
  }

  public checkAllBound() {
    const unboundAtoms = this.terms.entries()
      .filter(([, val]) => val === undefined || val === null)
      .map(([key]) => key)
      .toArray();
    if (unboundAtoms.length) {
      throw new Error("Unbound names: " + unboundAtoms);
    }
  }

  public getOrThrow<T>(name: Atom<T>): NamedRule<S, T> {
    const entry = this.terms.get(name);
    if (!entry) {
      throw new Error("No rule called " + name);
    }
    return entry;
  }

  public forward<T>(name: Atom<T>): NamedRule<S, T> {
    return this.getOrCreateEntry(name);
  }

  private getOrCreateEntry<T>(name: Atom<T>): DictionaryEntry<S, T> {
    const entry = this.terms.get(name);
    if (entry) {
      return entry;
    }
    const newEntry = new DictionaryEntry<S, T>(name);
    this.terms.set(name, newEntry);
    return newEntry;
  }

  public named<T>(name: Atom<T>): Term<S> {
    return new DictionaryReference<S, T>(this.getOrCreateEntry(name), name);
  }

  public namedWithAlias<T>(name: Atom<T>, alias: Atom<T>): Term<S> {
    return new DictionaryReference<S, T>(this.getOrCreateEntry(name), alias);
  }
}

class DictionaryEntry<S, T> implements NamedRule<S, T>, Supplier<string> {
  readonly name: Atom<T>;
  value: Rule<S, T> | undefined = undefined;

  constructor(name: Atom<T>) {
    this.name = name;
  }
  getName(): Atom<T> {
    return this.name;
  }
  getValue(): Rule<S, T> {
    if (this.value == null) {
      throw new Error("Rule value isn't set yet");
    }
    return this.value;
  }
  get(): string {
    return `Unbound rule ${this.name}`;
  }
}

class DictionaryReference<S, T> implements Term<S> {
  private readonly ruleToParse: DictionaryEntry<S, T>;
  private readonly nameToStore: Atom<T>;

  constructor(ruleToParse: DictionaryEntry<S, T>, nameToStore: Atom<T>) {
    this.ruleToParse = ruleToParse;
    this.nameToStore = nameToStore;
  }

  parse(state: ParseState<S>, scope: Scope, _control: Control): boolean {
    const rule = state.parse(this.ruleToParse);
    if (!rule) {
      return false;
    } else {
      scope.put(this.nameToStore, rule);
      return true;
    }
  }
}
