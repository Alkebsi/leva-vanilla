import Controller from './Controller';

export default class ActionController<
  O extends object,
  K extends keyof O,
> extends Controller<O, K> {
  trigger() {
    const fn = this.object[this.key];

    if (typeof fn === 'function') {
      fn.call(this.object);
    }
  }
}
