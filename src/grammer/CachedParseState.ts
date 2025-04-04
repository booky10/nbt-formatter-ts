import ErrorCollector, {ErrorCollectorNoOp} from "./ErrorCollector.js";
import Scope from "./Scope.js";
import NamedRule from "./NamedRule.js";
import {growByHalf} from "../common/util.js";
import Control from "./Control.js";
import Atom from "./Atom.js";
import ParseState, {parseTopRule} from "./ParseState.js";

export abstract class CachedParseState<S> implements ParseState<S> {
  private positionCache: PositionCache[] = new Array<PositionCache>(256);
  private readonly errorCollector: ErrorCollector<S>;
  private readonly scope: Scope = new Scope();
  private controlCache: SimpleControl[] = new Array<SimpleControl>(16);
  private nextControlToReturn: number;
  private silent: SilentCachedParseState<S> = new SilentCachedParseState<S>(this);

  protected constructor(errorCollector: ErrorCollector<S>) {
    this.errorCollector = errorCollector;
  }

  getScope(): Scope {
    return this.scope;
  }
  getErrorCollector(): ErrorCollector<S> {
    return this.errorCollector;
  }
  parseTopRule<T>(rule: NamedRule<S, T>): T | undefined {
    return parseTopRule(this, rule);
  }
  parse<T>(rule: NamedRule<S, T>): T | undefined {
    const cursor = this.mark();
    const cache = this.getCacheForPosition(cursor);

    let cacheIndex = cache.findKeyIndex(rule.getName());
    if (cacheIndex !== POSITION_CACHE_NOT_FOUND) {
      const value: CacheEntry<T> = cache.getValue(cacheIndex);
      if (value !== undefined && value !== null) {
        if (value === NEGATIVE_CACHE_ENTRY) {
          return undefined;
        }
        this.restore(value.getMarkAfterParse());
        return value.getValue();
      }
    } else {
      cacheIndex = cache.allocateNewEntry(rule.getName());
    }

    const value = rule.getValue().parse(this);
    const valueCache: CacheEntry<T> = value === undefined || value === null
      ? NEGATIVE_CACHE_ENTRY : new CacheEntry<T>(value, this.mark());

    cache.setValue(cacheIndex, valueCache);
    return value;
  }
  private getCacheForPosition(position: number): PositionCache {
    const cacheLength = this.positionCache.length;
    if (position >= cacheLength) {
      this.positionCache.length = growByHalf(cacheLength, position + 1);
    }
    let cache = this.positionCache[position];
    if (cache === undefined || cache === null) {
      cache = new PositionCache();
      this.positionCache[position] = cache;
    }
    return cache;
  }
  abstract getInput(): S;
  abstract mark(): number;
  abstract restore(cursor: number): void;
  acquireControl(): Control {
    const cacheLength = this.controlCache.length;
    if (this.nextControlToReturn >= cacheLength) {
      this.controlCache.length = growByHalf(cacheLength, this.nextControlToReturn + 1);
    }
    const index = this.nextControlToReturn++;
    let control = this.controlCache[index];
    if (control === undefined || control === null) {
      control = new SimpleControl();
      this.controlCache[index] = control;
    } else {
      control.reset();
    }
    return control;
  }
  releaseControl() {
    this.nextControlToReturn--;
  }
  asSilent(): ParseState<S> {
    return this.silent;
  }
}

class CacheEntry<T> {
  private readonly value: T | undefined;
  private readonly markAfterParse: number;

  constructor(value: T | undefined, markAfterParse: number) {
    this.value = value;
    this.markAfterParse = markAfterParse;
  }

  public getValue(): T | undefined {
    return this.value;
  }
  public getMarkAfterParse(): number {
    return this.markAfterParse;
  }
}

const NEGATIVE_CACHE_ENTRY = new CacheEntry<any>(undefined, -1);

const POSITION_CACHE_ENTRY_STRIDE = 2;
const POSITION_CACHE_NOT_FOUND = 2;

class PositionCache {
  private readonly atomCache: any[] = new Array<any>(16);
  private nextKey: number;

  public findKeyIndex(name: Atom<any>): number {
    for (let i = 0; i < this.nextKey; i += POSITION_CACHE_ENTRY_STRIDE) {
      if (this.atomCache[i] === name) {
        return i;
      }
    }
    return POSITION_CACHE_NOT_FOUND;
  }

  public allocateNewEntry(entry: Atom<any>) {
    const keyIndex = this.nextKey;
    this.nextKey += POSITION_CACHE_ENTRY_STRIDE;
    const entryIndex = keyIndex + 1;
    const length = this.atomCache.length;
    if (entryIndex >= length) {
      this.atomCache.length = growByHalf(length, entryIndex + 1);
    }
    this.atomCache[keyIndex] = entry;
    return keyIndex;
  }

  public getValue<T>(nameIndex: number): CacheEntry<T> | undefined {
    return this.atomCache[nameIndex + 1];
  }

  public setValue(nameIndex: number, entry: CacheEntry<any>) {
    this.atomCache[nameIndex + 1] = entry;
  }
}

class SilentCachedParseState<S> implements ParseState<S> {
  private readonly delegate: CachedParseState<S>;
  private readonly silentCollector: ErrorCollector<S> = new ErrorCollectorNoOp<S>();

  constructor(delegate: CachedParseState<S>) {
    this.delegate = delegate;
  }

  getScope(): Scope {
    return this.delegate.getScope();
  }
  getErrorCollector(): ErrorCollector<S> {
    return this.silentCollector;
  }
  parseTopRule<T>(rule: NamedRule<S, T>): T | undefined {
    return parseTopRule(this, rule);
  }
  parse<T>(rule: NamedRule<S, T>): T | undefined {
    return this.delegate.parse(rule);
  }
  getInput(): S {
    return this.delegate.getInput();
  }
  mark(): number {
    return this.delegate.mark();
  }
  restore(cursor: number) {
    this.delegate.restore(cursor);
  }
  acquireControl(): Control {
    return this.delegate.acquireControl();
  }
  releaseControl() {
    return this.delegate.releaseControl();
  }
  asSilent(): ParseState<S> {
    return this;
  }
}

class SimpleControl implements Control {
  private _hasCut: boolean = false;

  cut() {
    this._hasCut = true;
  }
  hasCut(): boolean {
    return this._hasCut;
  }
  public reset() {
    this._hasCut = false;
  }
}
