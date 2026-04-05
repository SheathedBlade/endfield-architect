import { ImportExportControls } from "./tools/ImportExportControls";
import { RawInputOverrides } from "./overrides/RawInputOverrides";
import { RecipeOverrides } from "./overrides/RecipeOverrides";

const PlannerTools = () => {
  return (
    <div className="panel">
      <div className="panel-header">Plan Tools</div>
      <div className="panel-body space-y-4">
        <RawInputOverrides />
        <div className="border-t border-border/50 pt-4">
          <RecipeOverrides />
        </div>
        <div className="border-t border-border/50 pt-4">
          <ImportExportControls />
        </div>
      </div>
    </div>
  );
};

export default PlannerTools;
