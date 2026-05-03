import { scheduleEffect } from './scheduler';
import type { Effect, ReactiveStore } from '../types';

export function createStore(): ReactiveStore {
  return {
    depsMap: new Map(),
    activeEffect: null,
    effectStack: [],
  };
}

export function track(store: ReactiveStore, key: string) {
  if (!store.activeEffect) return;

  let dep = store.depsMap.get(key);
  if (!dep) {
    dep = new Set();
    store.depsMap.set(key, dep);
  }

  if (dep.has(store.activeEffect)) return;

  dep.add(store.activeEffect);
  store.activeEffect.deps.push(dep);
}

export function trigger(store: ReactiveStore, key: string) {
  const dep = store.depsMap.get(key);
  if (!dep) return;

  [...dep].forEach((effect) => {
    scheduleEffect(effect.run);
  });
}

export function setActiveEffect(store: ReactiveStore, fn: Effect | null) {
  store.activeEffect = fn;
}

export function getActiveEffect(store: ReactiveStore) {
  return store.activeEffect;
}
