// import Controller from '../core/Controller';
import { Action, Checkbox, Color, Select, Slider, Text } from './controls';
import type { SelectOptions } from '../core/SelectController';
import NumericController from '../core/NumericController';
import ValueController from '../core/ValueController';
import type Controller from '../core/Controller';
import BooleanController from '../core/BooleanController';
import ActionController from '../core/ActionController';
import SelectController from '../core/SelectController';
import ColorController from '../core/ColorController';
import type { KeysOfType, ActionKeys } from '../utils/types';
import type { ColorValue } from '../utils/color';

export default class GUIContainer {
  protected container: HTMLElement;
  protected controllers: any[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  add<O extends object, K extends keyof O>(
    object: O,
    key: K
  ): O[K] extends string
    ? ValueController<O, K>
    : O[K] extends (...args: any[]) => any
    ? ActionController<O, Extract<K, ActionKeys<O>>>
    : O[K] extends number
    ? NumericController<O, K>
    : Controller<O, K>;

  add<O extends object, K extends keyof O>(
    object: O,
    key: K & (O[K] extends number ? K : never),
    min?: number,
    max?: number,
    step?: number
  ): NumericController<O, K>;

  add<O extends object, K extends keyof O>(
    object: O,
    key: K,
    options: SelectOptions<O[K]>
  ): SelectController<O, K>;

  add<O extends object, K extends keyof O>(
    object: O,
    key: K,
    arg1?: number | SelectOptions<O[K]>,
    arg2?: number,
    arg3?: number
  ) {
    const value = object[key];

    if (arg1 && typeof arg1 === 'object') {
      const selectControl = new SelectController(object, key);
      selectControl.setOptions(arg1);
      new Select(this.container, selectControl);
      return selectControl;
    }

    switch (typeof value) {
      case 'number':
        const numericControl = new NumericController(object, key);

        numericControl.minValue = arg1;
        numericControl.maxValue = arg2;
        numericControl.stepValue = arg3;

        new Slider(this.container, numericControl);
        this.controllers.push(numericControl);
        return numericControl;
      case 'boolean':
        const checkControl = new BooleanController(object, key);
        new Checkbox(this.container, checkControl);
        this.controllers.push(checkControl);
        return checkControl;
      case 'string':
        const textControl = new ValueController(object, key);
        new Text(this.container, textControl);
        this.controllers.push(textControl);
        return textControl;

      case 'function':
        const actionControl = new ActionController(object, key);
        this.controllers.push(actionControl);
        new Action(this.container, actionControl);
        return actionControl;
      // const functionControl = new Action(
      //   this.container,
      //   object,
      //   key as Extract<K, ActionKeys<O>>
      // );
      // this.controllers.push(functionControl);
      // return functionControl;
      default:
        throw new Error(`failed to add ${value} from ${object}.`);
    }
  }

  addColor<O extends object, K extends KeysOfType<O, ColorValue>>(
    object: O,
    key: K
  ) {
    const colorController = new ColorController(object, key);
    this.controllers.push(colorController);
    new Color(this.container, colorController);
    return colorController;
  }

  update() {
    this.controllers.forEach((c) => c.refresh());
  }

  destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.container.remove();
  }
}
