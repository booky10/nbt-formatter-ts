export const assert = (flag: boolean) => {
  if (!flag) {
    throw new Error("Assertion failed");
  }
};

export const SHORT_MAX_VALUE = (1 << 15) - 1;
export const SHORT_MIN_VALUE = ~SHORT_MAX_VALUE;
export const INTEGER_MAX_VALUE = (1 << 31) - 1;
export const INTEGER_MIN_VALUE = ~INTEGER_MAX_VALUE;

export const growByHalf = (value: number, minValue: number) => {
  return Math.max(Math.min(value + (value >> 1), INTEGER_MAX_VALUE - 8), minValue);
};
