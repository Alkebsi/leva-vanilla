import Controller from './Controller';

export default class NumericController<
  O extends object,
  K extends keyof O,
> extends Controller<O, K> {
  minValue?: number;
  maxValue?: number;
  stepValue?: number;

  set(value: O[K]) {
    let v = Number(value);

    if (this.minValue !== undefined) v = Math.max(this.minValue, v);
    if (this.maxValue !== undefined) v = Math.min(this.maxValue, v);

    super.set(v as O[K]);
  }

  min(value: number) {
    this.minValue = value;
    this.emitOptions();
    return this;
  }

  max(value: number) {
    this.maxValue = value;
    this.emitOptions();
    return this;
  }

  step(value: number) {
    this.stepValue = value;
    this.emitOptions();
    return this;
  }
}
