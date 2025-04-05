import {assert, growByHalf} from "../common/util.js";
import Atom from "./Atom.js";

// generate random frame start marker, javascript doesn't have comparison by object identity as far as I know
const NOT_FOUND = -1;
const FRAME_START_MARKER = Math.random().toString();
const ENTRY_STRIDE = 2;

export default class Scope {
  private stack: any[] = new Array<any>(128);
  private topEntryKeyIndex = 0;
  private topMarkerKeyIndex = 0;
  private depth = 0; // Paper - track depth

  constructor() {
    this.stack[0] = FRAME_START_MARKER;
    this.stack[1] = undefined;
  }

  private valueIndex(name: Atom<any>): number {
    for (let i = this.topEntryKeyIndex; i > this.topMarkerKeyIndex; i -= ENTRY_STRIDE) {
      const entryName = this.stack[i];
      assert(entryName instanceof Atom);
      if (entryName === name) {
        return i + 1;
      }
    }
    return NOT_FOUND;
  }

  public valueIndexForAny(...names: Atom<any>[]) {
    for (let i = this.topEntryKeyIndex; i > this.topMarkerKeyIndex; i -= ENTRY_STRIDE) {
      const entryName = this.stack[i];
      assert(entryName instanceof Atom);

      const matchedIndex = names.findIndex(name => entryName === name);
      if (matchedIndex >= 0) {
        return i + 1;
      }
    }
    return NOT_FOUND;
  }

  private ensureCapacity(requiredCapacity: number) {
    const stackLength = this.stack.length;
    const nextIndex = this.topEntryKeyIndex + 1;
    const expectedCapacity = nextIndex + requiredCapacity * ENTRY_STRIDE;
    if (expectedCapacity >= stackLength) {
      // I love javascript! (epic joke)
      this.stack.length = growByHalf(stackLength, expectedCapacity + 1);
    }
    assert(this.validateStructure());
  }

  private setupNewFrame() {
    this.topEntryKeyIndex += ENTRY_STRIDE;
    this.stack[this.topEntryKeyIndex] = FRAME_START_MARKER;
    this.stack[this.topEntryKeyIndex + 1] = this.topMarkerKeyIndex;
    this.topMarkerKeyIndex = this.topEntryKeyIndex;
  }

  public pushFrame() {
    this.ensureCapacity(1);
    this.setupNewFrame();
    assert(this.validateStructure());
  }

  private getPreviousMarkerIndex(markerIndex: number): number {
    const entry = this.stack[markerIndex + 1];
    assert(typeof entry === "number");
    return entry;
  }

  public popFrame() {
    assert(this.topMarkerKeyIndex !== 0);
    this.topEntryKeyIndex = this.topMarkerKeyIndex - ENTRY_STRIDE;
    this.topMarkerKeyIndex = this.getPreviousMarkerIndex(this.topMarkerKeyIndex);
    assert(this.validateStructure());
  }

  public splitFrame() {
    const markerIndex = this.topMarkerKeyIndex;
    const pivotIndex = (this.topEntryKeyIndex - this.topMarkerKeyIndex) / ENTRY_STRIDE;

    this.ensureCapacity(pivotIndex + 1);
    this.setupNewFrame();

    let newMarkerIndex = markerIndex + ENTRY_STRIDE;
    let index = this.topEntryKeyIndex;
    for (let i = 0; i < pivotIndex; i++) {
      index += ENTRY_STRIDE;

      const entry = this.stack[newMarkerIndex];
      assert(entry !== null && entry !== undefined);

      this.stack[index] = entry;
      this.stack[index + 1] = undefined;
      newMarkerIndex += ENTRY_STRIDE;
    }

    this.topEntryKeyIndex = index;
    assert(this.validateStructure());
  }

  public clearFrameValues() {
    for (let i = this.topEntryKeyIndex; i > this.topMarkerKeyIndex; i -= ENTRY_STRIDE) {
      assert(this.stack[i] instanceof Atom);
      this.stack[i + 1] = undefined;
    }
    assert(this.validateStructure());
  }

  public mergeFrame() {
    const previousMarkerIndex = this.getPreviousMarkerIndex(this.topMarkerKeyIndex);
    let markerIndex = previousMarkerIndex;
    let keyIndex = this.topMarkerKeyIndex;
    while (keyIndex < this.topEntryKeyIndex) {
      markerIndex += ENTRY_STRIDE;
      keyIndex += ENTRY_STRIDE;

      const entryName = this.stack[keyIndex];
      assert(entryName instanceof Atom);

      const entry = this.stack[keyIndex + 1];
      const markerName = this.stack[markerIndex];
      if (markerName !== entryName) {
        this.stack[markerIndex] = entryName;
        this.stack[markerIndex + 1] = entry;
      } else if (entry !== undefined && entry !== null) {
        this.stack[markerIndex + 1] = entry;
      }
    }

    this.topEntryKeyIndex = markerIndex;
    this.topMarkerKeyIndex = previousMarkerIndex;

    assert(this.validateStructure());
  }

  public put<T>(name: Atom<T>, value: T | undefined) {
    const normedValue = value === null ? undefined : value;
    const index = this.valueIndex(name);
    if (index !== NOT_FOUND) {
      this.stack[index] = normedValue;
    } else {
      this.ensureCapacity(1);
      this.topEntryKeyIndex += ENTRY_STRIDE;
      this.stack[this.topEntryKeyIndex] = name;
      this.stack[this.topEntryKeyIndex + 1] = normedValue;
    }
    assert(this.validateStructure());
  }

  public get<T>(name: Atom<T>): T | undefined {
    const index = this.valueIndex(name);
    return index !== NOT_FOUND ? this.stack[index] : undefined;
  }

  public getOrThrow<T>(name: Atom<T>): T {
    const index = this.valueIndex(name);
    if (index === NOT_FOUND) {
      throw new Error(`No value for atom ${name}`);
    }
    return this.stack[index];
  }

  public getOrDefault<T>(name: Atom<T>, defaultValue: T): T {
    const index = this.valueIndex(name);
    return index !== NOT_FOUND ? this.stack[index] : defaultValue;
  }

  public getAny<T>(...names: Atom<T>[]): T {
    const index = this.valueIndexForAny(...names);
    return index !== NOT_FOUND ? this.stack[index] : undefined;
  }

  public getAnyOrThrow<T>(...names: Atom<T>[]): T {
    const index = this.valueIndexForAny(...names);
    if (index === NOT_FOUND) {
      throw new Error(`No value for atoms ${names}`);
    }
    return this.stack[index];
  }

  public toString(): string {
    let builder = "";
    let firstEntry = true;
    for (let i = 0; i <= this.topEntryKeyIndex; i += ENTRY_STRIDE) {
      const name = this.stack[i];
      const entry = this.stack[i + 1];
      if (name === FRAME_START_MARKER) {
        builder += "|";
        firstEntry = true;
      } else {
        if (!firstEntry) {
          builder += ",";
        } else {
          firstEntry = false;
        }
        builder += `${name}:${entry}`;
      }
    }
    return builder;
  }

  public hasOnlySingleFrame() {
    for (let i = this.topEntryKeyIndex; i > 0; i--) {
      if (this.stack[i] === FRAME_START_MARKER) {
        return false;
      }
    }
    if (this.stack[0] !== FRAME_START_MARKER) {
      throw new Error("Corrupted stack");
    }
    return true;
  }

  private validateStructure(): boolean {
    assert(this.topMarkerKeyIndex >= 0);
    assert(this.topEntryKeyIndex >= this.topMarkerKeyIndex);

    for (let i = 0; i < this.topEntryKeyIndex; i += ENTRY_STRIDE) {
      const entry = this.stack[i];
      if (entry !== FRAME_START_MARKER && !(entry instanceof Atom)) {
        return false;
      }
    }

    for (let i = this.topMarkerKeyIndex; i !== 0; i = this.getPreviousMarkerIndex(i)) {
      const entry = this.stack[i];
      if (entry !== FRAME_START_MARKER) {
        return false;
      }
    }

    return true;
  }
}
