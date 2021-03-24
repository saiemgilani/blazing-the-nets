import bin, {Bin} from "./bin";
import {Shot} from "./types";

interface BinnedShots {
  bins: Bin[];
  totalShots: number;
  totalShotsWithinMaxDistance: number;
  totalMakes: number;
}

export function binShots(shots: Shot[], maxDistance: number): BinnedShots {
  const bins = bin(shots, maxDistance);

  return {
    bins,
    totalShots: shots.length,
    totalShotsWithinMaxDistance: bins.reduce((a, b) => a + b.SHOT_ATTEMPTED_FLAG, 0),
    totalMakes: bins.reduce((a, b) => a + b.SHOT_MADE_FLAG, 0),
  };
}

export default binShots;
