import { DistanceBars } from "./charts/DistanceBars.tsx";
import { HexShotChart } from "./charts/HexShotChart.tsx";
import { ShootingSignature } from "./charts/ShootingSignature.tsx";
import { SideChart } from "./charts/SideChart.tsx";
import { Card } from "./Card.tsx";
import type { DashboardData } from "@/lib/pageData.ts";

/** The six charts in the 2021 arrangement: shot chart + signature, the distance pair, the side pair. */
export function Dashboard({ data, subject }: { data: DashboardData; subject: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Shot chart">
        <HexShotChart data={data.hex} title={`${subject} shot chart`} />
      </Card>
      <Card title="Shooting signature">
        <ShootingSignature data={data.signature} title={`${subject} FG% by distance vs league`} />
      </Card>
      <Card title="Shot proportion by distance">
        <DistanceBars data={data.bars} metric="share" title={`${subject} share of shots by distance vs league`} />
      </Card>
      <Card title="Field goal percentage by distance">
        <DistanceBars data={data.bars} metric="fgPct" title={`${subject} FG% by distance vs league`} />
      </Card>
      <Card title="Shooting frequency by side">
        <SideChart data={data.sides} metric="share" title={`${subject} share of shots left, centre and right of the hoop`} />
      </Card>
      <Card title="Field goal percentage by side">
        <SideChart data={data.sides} metric="fgPct" title={`${subject} FG% left, centre and right of the hoop`} />
      </Card>
    </div>
  );
}
