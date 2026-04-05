import Controller from './Controller';

export type SelectOptions<V> = readonly V[] | Record<string, V>;

export default class SelectController<
  O extends object,
  K extends keyof O
> extends Controller<O, K> {
  options?: SelectOptions<O[K]>;

  setOptions(options: SelectOptions<O[K]>) {
    this.options = options;
    this.emitOptions();
    return this;
  }
}
