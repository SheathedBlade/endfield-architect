import type { PlannerLogistics } from "./usePlannerSceneModel";

interface LogisticsLayerProps {
  logistics: PlannerLogistics[];
}

export function LogisticsLayer({ logistics }: LogisticsLayerProps) {
  return (
    <div className="logistics-layer">
      {logistics.map((log) => (
        <LogisticsNode key={log.id} log={log} />
      ))}
    </div>
  );
}

function LogisticsNode({ log }: { log: PlannerLogistics }) {
  return (
    <div
      className="logistics-node"
      style={{
        left: log.x,
        top: log.y,
        width: log.w,
        height: log.h,
      }}
    >
      <span className="logistics-node__label">{log.label}</span>
    </div>
  );
}
