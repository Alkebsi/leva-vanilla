import type Controller from '../core/Controller';

// Utility type: keys of T whose value type extends V
export type KeysOfType<T, V> = {
  [P in keyof T]: T[P] extends V ? P : never;
}[keyof T];

// Keys of T whose value type is a function (action-like keys)
export type ActionKeys<T> = KeysOfType<T, (...args: unknown[]) => unknown>;

export interface ControllerInternals<O extends object, K extends keyof O> {
  onOptionsChange(fn: () => void): void;
  getName(): string | undefined;
  key: K;
  disabledValue: boolean;
}

export function internalsOf<O extends object, K extends keyof O>(
  controller: Controller<O, K>
): ControllerInternals<O, K> {
  return controller as unknown as ControllerInternals<O, K>;
}
