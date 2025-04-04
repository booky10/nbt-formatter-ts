import ParseState from "./ParseState.js";
import Scope from "./Scope.js";
import Control from "./Control.js";
import Atom from "./Atom.js";
import NamedRule from "./NamedRule.js";

export interface Term<S> {
  parse(state: ParseState<S>, scope: Scope, control: Control): boolean;
}

export class AlternativeTerm<S> implements Term<S> {
  private readonly elements: Term<S>[];

  constructor(elements: Term<S>[]) {
    this.elements = elements;
  }

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const acquiredControl = state.acquireControl();
    try {
      const cursor = state.mark();
      scope.splitFrame();
      for (let i = 0; i < this.elements.length; i++) {
        if (this.elements[i].parse(state, scope, acquiredControl)) {
          scope.mergeFrame();
          return true;
        }
        scope.clearFrameValues();
        state.restore(cursor);
        if (acquiredControl.hasCut()) {
          break;
        }
      }
      scope.popFrame();
      return false;
    } finally {
      state.releaseControl();
    }
  }

  public getElements() {
    return this.elements;
  }
}

export class LookAheadTerm<S> implements Term<S> {
  private readonly term: Term<S>;
  private readonly positive: boolean;

  constructor(term: Term<S>, positive: boolean) {
    this.term = term;
    this.positive = positive;
  }

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const cursor = state.mark();
    const result = this.term.parse(state.asSilent(), scope, control);
    state.restore(cursor);
    return this.positive == result;
  }

  public getTerm() {
    return this.term;
  }
  public isPositive() {
    return this.positive;
  }
}

export class MarkerTerm<S, T> implements Term<S> {
  private readonly name: Atom<T>;
  private readonly value: T;

  constructor(name: Atom<T>, value: T) {
    this.name = name;
    this.value = value;
  }

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    scope.put(this.name, this.value);
    return true;
  }

  public getName() {
    return this.name;
  }
  public getValue() {
    return this.value;
  }
}

export class MaybeTerm<S> implements Term<S> {
  private readonly term: Term<S>;

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const cursor = state.mark();
    if (!this.term.parse(state, scope, control)) {
      state.restore(cursor);
    }
    return true;
  }

  public getTerm() {
    return this.term;
  }
}

export class RepeatedTerm<S, T> implements Term<S> {
  private readonly element: NamedRule<S, T>;
  private readonly listName: Atom<T[]>;
  private readonly minRepetitions: number;

  constructor(element: NamedRule<S, T>, listName: Atom<T[]>, minRepetitions: number) {
    this.element = element;
    this.listName = listName;
    this.minRepetitions = minRepetitions;
  }

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const startCursor = state.mark();
    const values = new Array<T>(this.minRepetitions);
    for (let i = 0; true; i++) {
      const cursor = state.mark();
      const value = state.parse(this.element);
      if (value === undefined || value === null) {
        state.restore(cursor);
        if (values.length < this.minRepetitions) {
          state.restore(startCursor);
          return false;
        } else {
          scope.put(this.listName, values);
          return true;
        }
      }
      values[i] = value;
    }
  }

  public getElement() {
    return this.element;
  }
  public getListName() {
    return this.listName;
  }
  public getMinRepetitions() {
    return this.minRepetitions;
  }
}

export class RepeatedWithSeparatorTerm<S, T> implements Term<S> {
  private readonly element: NamedRule<S, T>;
  private readonly listName: Atom<T[]>;
  private readonly separator: Term<S>;
  private readonly minRepetitions: number;
  private readonly allowTrailingSeparator: boolean;

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const startCursor = state.mark();
    const values = new Array<T>();
    let firstValue = true;
    for (let i = 0; true; i++) {
      const separatorCursor = state.mark();
      if (!firstValue && !this.separator.parse(state, scope, control)) {
        state.restore(separatorCursor);
        break;
      }
      const cursor = state.mark();
      const value = state.parse(this.element);
      if (value === undefined || value === null) {
        if (firstValue) {
          state.restore(cursor);
        } else {
          if (!this.allowTrailingSeparator) {
            state.restore(startCursor);
            return false;
          }
          state.restore(cursor);
        }
        break;
      }
      values[i] = value;
      firstValue = false;
    }

    if (values.length < this.minRepetitions) {
      state.restore(startCursor);
      return false;
    } else {
      scope.put(this.listName, values);
      return true;
    }
  }

  public getElement() {
    return this.element;
  }
  public getListName() {
    return this.listName;
  }
  public getSeparator() {
    return this.separator;
  }
  public getMinRepetitions() {
    return this.minRepetitions;
  }
  public isAllowTrailingSeparator() {
    return this.allowTrailingSeparator;
  }
}

export class SequenceTerm<S> implements Term<S> {
  private readonly elements: Term<S>[];

  constructor(elements: Term<S>[]) {
    this.elements = elements;
  }

  parse(state: ParseState<S>, scope: Scope, control: Control): boolean {
    const cursor = state.mark();
    for (let i = 0; i < this.elements.length; i++) {
      if (!this.elements[i].parse(state, scope, control)) {
        state.restore(cursor);
        return false;
      }
    }
    return true;
  }

  public getElements() {
    return this.elements;
  }
}
