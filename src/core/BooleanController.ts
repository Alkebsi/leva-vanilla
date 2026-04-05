import Controller from './Controller';

export default class BooleanController<
  O extends object,
  K extends keyof O,
> extends Controller<O, K> {
  set(value: O[K]) {
    super.set(Boolean(value) as O[K]);
  }
}
