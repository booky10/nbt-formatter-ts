export const assert = (flag: boolean) => {
  if (!flag) {
    throw new Error("Assertion failed");
  }
};

export const INTEGER_MIN_VALUE = 1 << 31;
export const INTEGER_MAX_VALUE = ~INTEGER_MIN_VALUE;

export const growByHalf = (value: number, minValue: number) => {
  return Math.max(Math.min(value + (value >> 1), INTEGER_MAX_VALUE - 8), minValue);
};
