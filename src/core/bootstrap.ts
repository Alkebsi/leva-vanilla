import { register } from './registry';
import { createNumberController } from './NumberController';
import { createBooleanController } from './BooleanController';
import { createSelectController } from './SelectController';
import { createButtonController } from './ButtonController';

let initialized = false;

export function registerDefaults() {
  if (initialized) return;

  register('number', createNumberController);
  register('boolean', createBooleanController);
  register('select', createSelectController);
  register('button', createButtonController);

  initialized = true;
}
