import { RawInputOverrides } from "./overrides/RawInputOverrides";
import { RecipeOverrides } from "./overrides/RecipeOverrides";
import { ImportExportControls } from "./tools/ImportExportControls";
import CollapsiblePanel from "./ui/CollapsiblePanel";

const PlannerTools = () => {
  return (
    <CollapsiblePanel title="Plan Tools">
      <div className="space-y-4">
        <RawInputOverrides />
        <div className="border-t border-border/50 pt-4">
          <RecipeOverrides />
        </div>
        <div className="border-t border-border/50 pt-4">
          <ImportExportControls />
        </div>
      </div>
    </CollapsiblePanel>
  );
};

export default PlannerTools;
