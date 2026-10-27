import { DistanceBars } from "./charts/DistanceBars.tsx";
import { HexShotChart, type CompareSlot } from "./charts/HexShotChart.tsx";
import { ShootingSignature } from "./charts/ShootingSignature.tsx";
import { SideChart } from "./charts/SideChart.tsx";
import { Card } from "./Card.tsx";
import type { CardMeta } from "@/lib/charts/exportCard.ts";
import type { DashboardData } from "@/lib/dashboard.ts";

/**
 * The six charts in the 2021 arrangement: shot chart + signature, the distance pair, the side pair.
 * `card` turns on the shot chart's export; `compare` adds its compare view.
 */
export function Dashboard({
  data,
  subject,
  subjectLabel = "Player",
  card,
  compare,
}: {
  data: DashboardData;
  subject: string;
  subjectLabel?: "Player" | "Team";
  card?: CardMeta;
  compare?: CompareSlot;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Shot chart">
        <HexShotChart data={data.hex} title={`${subject} shot chart`} card={card} compare={compare} />
      </Card>
      <Card title="Shooting signature">
        <ShootingSignature data={data.signature} title={`${subject} FG% by distance vs league`} />
      </Card>
      <Card title="Shot proportion by distance">
        <DistanceBars data={data.bars} metric="share" subjectLabel={subjectLabel} title={`${subject} share of shots by distance vs league`} />
      </Card>
      <Card title="Field goal percentage by distance">
        <DistanceBars data={data.bars} metric="fgPct" subjectLabel={subjectLabel} title={`${subject} FG% by distance vs league`} />
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
