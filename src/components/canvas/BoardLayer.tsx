import type { PlannerBoard } from "./usePlannerSceneModel";

interface BoardLayerProps {
  boards: PlannerBoard[];
}

export function BoardLayer({ boards }: BoardLayerProps) {
  return (
    <div className="board-layer">
      {boards.map((board) => (
        <Board key={board.id} board={board} />
      ))}
    </div>
  );
}

function Board({ board }: { board: PlannerBoard }) {
  const {
    boardX,
    boardY,
    boardW,
    boardH,
    gridOriginX,
    gridOriginY,
    gridPixelW,
    gridPixelH,
    gridX,
    gridY,
    siteName,
  } = board;

  const gridAreaLeft = gridOriginX - boardX;
  const gridAreaTop = gridOriginY - boardY;

  return (
    <div
      className="board"
      style={{
        left: boardX,
        top: boardY,
        width: boardW,
        height: boardH,
      }}
    >
      <div className="board__header">
        <span className="board__name">{siteName.toUpperCase()}</span>
        <span className="board__dims">
          {gridX}×{gridY}
        </span>
      </div>

      <div
        className="board__grid-area"
        style={{
          left: gridAreaLeft,
          top: gridAreaTop,
          width: gridPixelW,
          height: gridPixelH,
        }}
      >
        <div className="board__grid" />
        <div className="board__grid-major" />
      </div>
    </div>
  );
}
