interface HasDistance {
  SHOT_DISTANCE: number;
}

const isLessThanDistance = (SHOT_DISTANCE: number) => (el: HasDistance): boolean =>
  el.SHOT_DISTANCE <= SHOT_DISTANCE;

export default isLessThanDistance;
