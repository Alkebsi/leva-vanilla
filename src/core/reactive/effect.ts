import { setActiveEffect } from './deps';
import type { Effect, ReactiveStore } from '../types';

export function effect(store: ReactiveStore, fn: () => void): () => void {
  const effectFn: Effect = {
    run: () => {
      cleanup(effectFn);

      store.effectStack.push(effectFn);
      setActiveEffect(store, effectFn);

      try {
        fn();
      } finally {
        store.effectStack.pop();
        setActiveEffect(
          store,
          store.effectStack[store.effectStack.length - 1] || null
        );
      }
    },
    deps: [],
  };

  effectFn.run();

  return () => cleanup(effectFn);
}

function cleanup(effectFn: Effect) {
  for (const dep of effectFn.deps) {
    dep.delete(effectFn);
  }
  effectFn.deps.length = 0;
}
