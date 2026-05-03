import type { AnyController } from '../core/types';

export type Controls = {
  _controllers: Record<string, AnyController>;
  effect: (fn: () => void) => () => void;
};
