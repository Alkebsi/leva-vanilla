import Controller from './Controller';

import {
  parseColor,
  applyColor,
  type ColorValue,
  type NormalizedRGB,
  type ParsedColor,
} from '../utils/color';

export default class ColorController<
  O extends object,
  K extends keyof O
> extends Controller<O, K> {
  normalized: NormalizedRGB;

  kind: ParsedColor['kind'];
  max: number;

  constructor(object: O, key: K) {
    super(object, key);

    const parsed = parseColor(this.get() as ColorValue);

    if (!parsed) {
      this.normalized = { r: 0, g: 0, b: 0 };
      this.kind = 'string';
      this.max = 255;
      return;
    }

    this.normalized = parsed.normalized;
    this.kind = parsed.kind;
    this.max = parsed.max;
  }

  setNormalized(normalized: NormalizedRGB) {
    this.normalized = normalized;

    const updated = applyColor(
      this.get() as ColorValue,
      normalized,
      this.kind,
      this.max
    );

    this.set(updated as O[K]);
  }

  refreshFromValue() {
    const parsed = parseColor(this.get() as ColorValue);

    if (!parsed) {
      return;
    }

    this.normalized = parsed.normalized;
    this.kind = parsed.kind;
    this.max = parsed.max;
  }
}
