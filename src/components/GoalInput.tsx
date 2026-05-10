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
    <div className="goal-input">
      {/* Header */}
      <div className="goal-input__header">
        <span className="goal-input__title">Goals</span>
        <div className="goal-input__actions">
          {goals.length > 0 && !showClearConfirm && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="goal-input__clear-btn"
            >
              <Eraser className="w-3 h-3" strokeWidth={2} />
              <span>Clear</span>
            </button>
          )}
          {showClearConfirm && (
            <div className="goal-input__confirm">
              <span className="goal-input__confirm-text">
                Clear {goals.length} goal{goals.length !== 1 ? "s" : ""}?
              </span>
              <button
                type="button"
                onClick={() => { handleClearAll(); setShowClearConfirm(false); }}
                className="goal-input__confirm-yes"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="goal-input__confirm-no"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add button */}
      {!isAdding && (
        <button
          type="button"
          onClick={openAdd}
          className="goal-input__add-btn"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Add Goal</span>
        </button>
      )}

      {/* Goal list */}
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

      {/* Goal editor form */}
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
  );
};

export default GoalInput;