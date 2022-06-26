import jwt from 'jsonwebtoken';
import { UserType } from './types.js';

export const generateAccessToken = (user: UserType) =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  jwt.sign(JSON.parse(JSON.stringify(user)), process.env.SECRET_ACCESS_TOKEN!, {
    expiresIn: '36500d',
  });

// assertion

export const assertNonNullish = <T>(
  value: T,
  message: string
): asserts value is NonNullable<T> => {
  if (value === null || value === undefined) throw new Error(message);
};

export function assertIsNotNullOrUndefined(
  value: unknown | undefined,
  msg: string
): boolean {
  if (value === undefined || null) throw Error(msg);
  return true;
}

export const assertsIsDefined = (
  value: unknown | undefined,
  message: string
): asserts value => {
  if (value === null || value === undefined) throw new Error(message);
};

export const isTruthy = <T>(
  data: T
): data is Exclude<T, null | undefined | false | '' | 0> => !!data;

export const assertIsNotArray = (value: unknown | undefined) =>
  !Array.isArray(value);

export function assertIsArray(
  value: unknown | undefined,
  msg: string
): asserts value {
  if (value === undefined) throw Error(msg);
  if (value === null) throw Error(msg);
  if (!Array.isArray(value)) throw new Error(msg);
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

export const assertSumIsNegative = (num1: number, num2: number): boolean =>
  num1 + num2 < 0;
