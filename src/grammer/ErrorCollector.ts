import {growByHalf} from "./util.js";
import ErrorEntry from "./ErrorEntry.js";

export default interface ErrorCollector<S> {
  store(cursor: number, reason: any): void;

  finish(cursor: number): void;
}

const DEFAULT_REASON = "empty";

type MutableErrorEntry<S> = {
  reason: any
}

export class ErrorCollectorLongestOnly<S> implements ErrorCollector<S> {

  private entries: MutableErrorEntry<S>[] = new Array<MutableErrorEntry<S>>(16);
  private nextErrorEntry: number = 0;
  private lastCursor: number = -1;

  private discardErrorsFromShorterParse(cursor: number) {
    if (cursor > this.lastCursor) {
      this.lastCursor = cursor;
      this.nextErrorEntry = 0;
    }
  }

  store(cursor: number, reason: any) {
    this.discardErrorsFromShorterParse(cursor);
    if (cursor === this.lastCursor) {
      this.addErrorEntry(reason);
    }
  }
  finish(cursor: number) {
    this.discardErrorsFromShorterParse(cursor);
  }

  private addErrorEntry(reason: any) {
    const entryLength = this.entries.length;
    if (this.nextErrorEntry >= entryLength) {
      this.entries.length = growByHalf(entryLength, this.nextErrorEntry + 1);
    }
    const errorIndex = this.nextErrorEntry++;
    const entry = this.entries[errorIndex];
    if (entry === undefined || entry === null) {
      this.entries[errorIndex] = {reason};
    } else {
      entry.reason = reason;
    }
  }

  public getEntries(): ErrorEntry<S>[] {
    const nextIndex = this.nextErrorEntry;
    if (nextIndex === 0) {
      return [];
    }
    const entries = new Array<ErrorEntry<S>>(nextIndex);
    for (let i = 0; i < nextIndex; i++) {
      const mutableEntry = this.entries[i];
      entries[i] = new ErrorEntry<S>(this.lastCursor, mutableEntry.reason);
    }
    return entries;
  }

  public getCursor() {
    return this.lastCursor;
  }
}

export class ErrorCollectorNoOp<S> implements ErrorCollector<S> {
  store(cursor: number, reason: any): void {
    // NO-OP
  }
  finish(cursor: number): void {
    // NO-OP
  }
}
