import binByDistance from "./bin";
import {Shot} from "./types";

interface RibbonBin {
  shootingPct: number;
  width: number;
}

export function ribbonShots(data: Shot[], maxDistance: number): RibbonBin[] {
  const bins = binByDistance(data, maxDistance);
  const totalShots = bins.reduce((a, b) => a + b.SHOT_ATTEMPTED_FLAG, 0);

  const ribbonBins = bins.map((bin) => {
    const shootingPct = bin.SHOT_ATTEMPTED_FLAG > 0 ? bin.SHOT_MADE_FLAG / bin.SHOT_ATTEMPTED_FLAG : 0;
    const width = bin.SHOT_ATTEMPTED_FLAG / totalShots;
    return {
      shootingPct,
      width,
    };
  });

  // TODO: implement smoothing function

  return ribbonBins;
}

export default ribbonShots;
