import { useState } from "react";
import { useAppStore } from "@/store";
import { Eraser, Plus } from "lucide-react";
import { GoalEditor } from "./goals/GoalEditor";
import { GoalList } from "./goals/GoalList";
import { useGoalEditorState } from "./goals/useGoalEditorState";

const GoalInput = () => {
  const { goals } = useAppStore((s) => s.plan);
  const {
    isAdding,
    draftItem,
    draftRate,
    exiting,
    entering,
    showPicker,
    pickerSearch,
    pickerHighlighted,
    openAdd,
    openEdit,
    selectFromPicker,
    cancelEdit,
    confirmEdit,
    handlePickerKeyDown,
    handleRemove,
    handleClearAll,
    isEditing,
    filteredPickerItems,
    setDraftItem,
    setDraftRate,
    setPickerSearch,
    setShowPicker,
    setPickerHighlighted,
  } = useGoalEditorState();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="panel z-dropdown">
      <div className="panel-header">
        <span>Production Goals</span>
        {goals.length > 0 && !showClearConfirm && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="ml-auto btn-tactical danger flex items-center gap-1 text-[0.65rem] self-center"
            style={{ padding: "0.2rem 0.5rem" }}
          >
            <Eraser className="w-3 h-3" strokeWidth={2} />
            <span>Clear</span>
          </button>
        )}
        {showClearConfirm && (
          <div className="ml-auto flex items-center gap-2">
            <span className="font-display text-[0.6rem] text-status-error">
              Clear {goals.length} goal{goals.length !== 1 ? "s" : ""}?
            </span>
            <button
              type="button"
              onClick={() => { handleClearAll(); setShowClearConfirm(false); }}
              className="btn-tactical danger flex items-center gap-1 text-[0.6rem]"
              style={{ padding: "0.2rem 0.5rem" }}
            >
              Yes, clear
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(false)}
              className="btn-tactical ghost flex items-center gap-1 text-[0.6rem]"
              style={{ padding: "0.2rem 0.5rem" }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="panel-body p-5">
        {!isAdding && (
          <button
            type="button"
            onClick={openAdd}
            className="btn-tactical w-full flex items-center justify-center gap-2 border border-accent-border/20"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Add Goal</span>
          </button>
        )}

        <div className={`goal-list-container${isAdding ? "" : " expanded"}`}>
          <div className="goal-list-container-inner">
            <GoalList
              exiting={exiting}
              entering={entering}
              onRemove={handleRemove}
              onEdit={openEdit}
            />
          </div>
        </div>

        <div className={`goal-form-container${isAdding ? " expanded" : ""}`}>
          <div className="goal-form-container-inner">
            {isAdding && (
              <GoalEditor
                draftItem={draftItem}
                draftRate={draftRate}
                isEditing={isEditing}
                showPicker={showPicker}
                pickerSearch={pickerSearch}
                pickerHighlighted={pickerHighlighted}
                filteredPickerItems={filteredPickerItems}
                selectFromPicker={selectFromPicker}
                confirmEdit={confirmEdit}
                cancelEdit={cancelEdit}
                handlePickerKeyDown={handlePickerKeyDown}
                setDraftItem={setDraftItem}
                setDraftRate={setDraftRate}
                setPickerSearch={setPickerSearch}
                setShowPicker={setShowPicker}
                setPickerHighlighted={setPickerHighlighted}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalInput;
