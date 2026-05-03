let queued = false;
const queue = new Set<() => void>();

// prevent re-entrance
const running = new Set<() => void>();

export function scheduleEffect(fn: () => void) {
  queue.add(fn);

  if (!queued) {
    queued = true;

    queueMicrotask(() => {
      try {
        queue.forEach((effect) => {
          // skip if already running (prevents infinite loops / recursion)
          if (running.has(effect)) return;

          running.add(effect);
          effect();
          running.delete(effect);
        });
      } finally {
        queue.clear();
        queued = false;
      }
    });
  }
}
