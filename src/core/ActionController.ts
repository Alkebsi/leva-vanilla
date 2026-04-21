import Controller from './Controller';

export default class ActionController<
  O extends object,
  K extends keyof O,
> extends Controller<O, K> {
  protected disabledValue = false;

  trigger() {
    if (this.disabledValue) return;

    const fn = this.object[this.key];

    if (typeof fn === 'function') {
      fn.call(this.object);
    }
  }

  disable(disabled = true) {
    this.disabledValue = disabled;
    this.emitOptions();
    return this;
  }
}
