//@ts-expect-error this is how the new API should look like, this demo needs to work
import { leva } from './dom/GUI';

const controls = leva({
  speed: { value: 1, min: 0, max: 2 },
});

leva.effect(() => {
  controls.log(controls.speed);
});
