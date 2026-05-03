import type { AnyController, ReactiveStore, ValueController } from '../types';
import { track, trigger } from './deps';

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function createStateProxy<T extends Record<string, unknown>>(
  state: T,
  controllers: Record<string, AnyController>,
  store: ReactiveStore,
  path: string[] = []
): T {
  return new Proxy(state, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);

      if (
        typeof key === 'symbol' ||
        key === '_tree' ||
        key === '_controllers' ||
        key === 'effect'
      )
        return value;

      const fullPath = [...path, key].join('.');
      track(store, fullPath);

      if (isObject(value)) {
        return createStateProxy(value, controllers, store, [...path, key]);
      }
      return value;
    },

    set(target, key, value, receiver) {
      if (
        typeof key === 'symbol' ||
        key === '_tree' ||
        key === '_controllers' ||
        key === 'effect'
      ) {
        return Reflect.set(target, key, value, receiver);
      }

      const fullPath = [...path, key].join('.');
      const controller = controllers[fullPath];

      if (controller && 'set' in controller) {
        (controller as ValueController<unknown, string>).set(value);
        return true;
      }

      if (Object.is(target[key as keyof T], value)) return true;

      const success = Reflect.set(target, key, value, receiver);
      if (success) {
        trigger(store, fullPath);
      }
      return success;
    },
  });
}
