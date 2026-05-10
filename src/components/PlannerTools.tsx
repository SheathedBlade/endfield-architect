import { RawInputOverrides } from "./overrides/RawInputOverrides";
import { RecipeOverrides } from "./overrides/RecipeOverrides";

const PlannerTools = () => {
  return (
    <div className="planner-tools">
      <p className="planner-tools__hint">
        Override solver choices for fine-tuned planning.
      </p>
      <div className="planner-tools__sections">
        <RawInputOverrides />
        <div className="planner-tools__divider" />
        <RecipeOverrides />
      </div>
    </div>
  );
};

export default PlannerTools;