import {Term} from "../Term.js";
import StringReader from "../../common/StringReader.js";
import ParseState from "../ParseState.js";
import Scope from "../Scope.js";
import Control from "../Control.js";

export default class StringReaderTerms {

  static word(value: string): Term<StringReader> {
    return new TerminalWord(value);
  }

  static character(value: string): Term<StringReader> {
    return new (class AnonymousTerminalCharacters extends TerminalCharacters {
      protected isAccepted(c: string): boolean {
        return c === value;
      }
    })([value]);
  }

  static characters(value1: string, value2: string) {
    return new (class AnonymousTerminalCharacters extends TerminalCharacters {
      protected isAccepted(c: string): boolean {
        return c === value1 || c === value2;
      }
    })([value1, value2]);
  }

  static createReader(input: string, cursor: number) {
    const reader = new StringReader(input);
    reader.setCursor(cursor);
    return reader;
  }
}

export abstract class TerminalCharacters implements Term<StringReader> {
  private readonly error: () => Error;

  constructor(characters: string[]) {
    const joinedCharacters = characters.join("|");
    this.error = () => new Error(`Expected literal ${joinedCharacters}`);
  }

  parse(state: ParseState<StringReader>, scope: Scope, control: Control): boolean {
    state.getInput().skipWhitespace();
    const cursor = state.mark();
    if (state.getInput().canRead() && this.isAccepted(state.getInput().read())) {
      return true;
    } else {
      state.getErrorCollector().store(cursor, this.error());
      return false;
    }
  }

  protected abstract isAccepted(c: string): boolean;
}

export class TerminalWord implements Term<StringReader> {
  private readonly value: string;
  private readonly error: () => Error;

  constructor(value: string) {
    this.value = value;
    this.error = () => new Error(`Expected literal ${value}`);
  }

  parse(state: ParseState<StringReader>, scope: Scope, control: Control): boolean {
    state.getInput().skipWhitespace();
    const cursor = state.mark();
    const string = state.getInput().readUnquotedString();
    if (string !== this.value) {
      state.getErrorCollector().store(cursor, this.error());
      return false;
    } else {
      return true;
    }
  }

  public toString() {
    return `terminal[${this.value}]`;
  }
}
