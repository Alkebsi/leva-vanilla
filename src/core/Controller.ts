export default class Controller<O extends object, K extends keyof O> {
  protected object: O;
  protected key: K;

  protected listeners = new Set<(value: O[K]) => void>();
  protected optionListeners = new Set<() => void>();
  protected nameValue?: string;

  constructor(object: O, key: K) {
    this.object = object;
    this.key = key;
  }

  get() {
    return this.object[this.key];
  }

  set(value: O[K]) {
    this.object[this.key] = value;
    this.emit(value);
  }

  onChange(fn: (value: O[K]) => void) {
    this.listeners.add(fn);
    return this;
  }

  name(name: string) {
    this.nameValue = name;
    this.emitOptions();
    return this;
  }

  protected getName() {
    return this.nameValue;
  }

  protected emit(value: O[K]) {
    this.listeners.forEach((fn) => fn(value));
  }

  protected onOptionsChange(fn: () => void) {
    this.optionListeners.add(fn);
  }

  protected emitOptions() {
    this.optionListeners.forEach((fn) => fn());
  }

  destroy() {
    this.listeners.clear();
    this.optionListeners.clear();
  }

  listen() {
    const loop = () => {
      this.refresh();
      requestAnimationFrame(loop);
    };
    loop();
  }

  refresh() {
    this.emit(this.get());
  }
}
