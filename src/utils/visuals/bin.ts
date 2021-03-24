import {isLessThanDistance} from "./filters";
import {LeftRight, Shot} from "./types";

export interface Bin {
  SHOT_MADE_FLAG: number;
  SHOT_ATTEMPTED_FLAG: number;
}

function bin(shots: Shot[], maxDistance: number): Bin[] {
  const bins: Bin[] = Array(maxDistance + 1)
    .fill(undefined)
    .map(() => ({SHOT_MADE_FLAG: 0, SHOT_ATTEMPTED_FLAG: 0}));

  shots.filter(isLessThanDistance(maxDistance)).forEach((shot) => {
    const {SHOT_DISTANCE, SHOT_MADE_FLAG} = shot;
    bins[SHOT_DISTANCE].SHOT_ATTEMPTED_FLAG += 1;
    bins[SHOT_DISTANCE].SHOT_MADE_FLAG += +SHOT_MADE_FLAG;
  });

  return bins;
}

export function binLeftRight(
  shots: Shot[],
  maxDistance: number
): LeftRight<Bin[]> {
  const binsLeft: Bin[] = Array(maxDistance + 1)
    .fill(undefined)
    .map(() => ({SHOT_MADE_FLAG: 0, SHOT_ATTEMPTED_FLAG: 0}));
  const binsRight: Bin[] = Array(maxDistance + 1)
    .fill(undefined)
    .map(() => ({SHOT_MADE_FLAG: 0, SHOT_ATTEMPTED_FLAG: 0}));

  shots.filter(isLessThanDistance(maxDistance)).forEach((shot) => {
    const {SHOT_DISTANCE, SHOT_MADE_FLAG, LOC_X} = shot;
    if (LOC_X < 0) {
      binsLeft[SHOT_DISTANCE].SHOT_ATTEMPTED_FLAG += 1;
      binsLeft[SHOT_DISTANCE].SHOT_MADE_FLAG += +SHOT_MADE_FLAG;
    } else if (LOC_X > 0) {
      binsRight[SHOT_DISTANCE].SHOT_ATTEMPTED_FLAG += 1;
      binsRight[SHOT_DISTANCE].SHOT_MADE_FLAG += +SHOT_MADE_FLAG;
    }
  });

  return {left: binsLeft, right: binsRight};
}

export default bin;
