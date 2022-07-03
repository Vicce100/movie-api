export function assertsValueToType<T>(value: unknown): asserts value is T {}

export function assertNonNullish<T>(
  value: T,
  message: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) throw new Error(message);
}

export function assertNullish(
  value: unknown,
  message: string
): asserts value is null {
  if (value !== null) throw new Error(message);
}

export function assertIsNotNullOrUndefined(
  value: unknown | undefined,
  msg: string
): boolean {
  if (value === undefined || null) throw Error(msg);
  return true;
}

export function assertsIsDefined(
  value: unknown | undefined,
  message: string
): asserts value {
  if (value === null || value === undefined) throw new Error(message);
}

export function isTruthy<T>(
  data: T
): data is Exclude<T, null | undefined | false | '' | 0> {
  return !!data;
}

export function assertIsNotArray(value: unknown | undefined) {
  return !Array.isArray(value);
}

export function assertIsNonEmptyArray(
  value: unknown | undefined,
  msg: string
): asserts value {
  if (value === undefined) throw Error(msg);
  if (value === null) throw Error(msg);
  if (!Array.isArray(value)) throw new Error(msg);
  if (!value.length) throw new Error(msg);
}

export function assertsIsString(value: unknown): asserts value is string {
  if (value === undefined) throw Error('value needs to be a string');
  if (value === null) throw Error('value needs to be a string');
  if (typeof value !== 'string') throw Error('value needs to be a string');
  if (value.trim().length <= 0) throw Error('value cannot be empty');
}

export function assertIsString(value: unknown | undefined): value is string {
  const msg = 'Value must be a valid String';
  if (value === undefined) throw new Error(msg);
  if (value === null) throw new Error(msg);
  if (typeof value !== 'string') throw new Error(msg);
  return true;
}

export function assertsIsNumber(value: unknown): asserts value is number {
  if (value === undefined || null) throw Error('value needs to be a number');
  if (typeof value !== 'number') throw Error('value needs to be a number');
  if (!Number.isInteger(value)) throw Error('value must be of type number');
}

export function assertsIsNotNumber(value: unknown): boolean {
  if (value === undefined || null) return true;
  if (typeof value !== 'number') return true;
  return false;
}

export function assertsIsStringArray(
  arrayValue: unknown | undefined
): asserts arrayValue is Array<string> {
  if (arrayValue === null || undefined)
    throw Error('value needs to be an array of strings');
  if (!Array.isArray(arrayValue))
    throw Error('value needs to be an array of strings');
  if (!arrayValue.every((prop) => typeof prop === 'string'))
    throw Error('array needs to contain strings');
}

export function assertIsStringArray(
  arrayLikeObject: unknown | undefined
): boolean {
  if (arrayLikeObject === null || arrayLikeObject === undefined) return false;
  if (!Array.isArray(arrayLikeObject)) return false;
  return arrayLikeObject.every((prop) => typeof prop === 'string');
}

export function assertSumIsNegative(num1: number, num2: number): boolean {
  return num1 + num2 < 0;
}

export function assertsRegex(regex: RegExp, str: string) {
  return regex.test(str);
}
