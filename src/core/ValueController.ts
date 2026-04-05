import Controller from './Controller';

export default class ValueController<
  O extends object,
  K extends keyof O,
> extends Controller<O, K> {
  set(value: O[K]) {
    super.set(value);
  }
}
