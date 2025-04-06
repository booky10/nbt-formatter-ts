export const assert = (flag: boolean) => {
  if (!flag) {
    throw new Error("Assertion failed");
  }
};

export const SHORT_MAX_VALUE = (1 << 15) - 1;
export const SHORT_MIN_VALUE = ~SHORT_MAX_VALUE;
export const INTEGER_MAX_VALUE = ~(1 << 31);
export const INTEGER_MIN_VALUE = INTEGER_MAX_VALUE;

export const growByHalf = (value: number, minValue: number) => {
  return Math.max(Math.min(value + (value >> 1), INTEGER_MAX_VALUE - 8), minValue);
};

export const MIN_CODE_POINT = 0x000000;
export const MAX_CODE_POINT = 0x10FFFF;

export const isValidCodePoint = (codePoint: number) => {
  return codePoint >= MIN_CODE_POINT && codePoint <= MAX_CODE_POINT;
};

export const IGNORE_CASE_COMPARATOR = new Intl.Collator(undefined, {sensitivity: "accent"});

export type MapEntry<K, V> = {
  key: K,
  value: V,
}

export const nanos = (): number => Math.ceil(performance.now() * 1_000_000);

export const MIN_RADIX = 2
export const MAX_RADIX = 36
