export type AcceptPromise<T> = T | Promise<T>;

export function isValidString(value: unknown, minLength = 1): value is string {
  return typeof value === 'string' && value.length >= minLength;
}
