import { Plus } from "lucide-react";
import { GoalEditor } from "./goals/GoalEditor";
import { GoalList } from "./goals/GoalList";
import { useGoalEditorState } from "./goals/useGoalEditorState";

const GoalInput = () => {
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
    isEditing,
    filteredPickerItems,
    setDraftItem,
    setDraftRate,
    setPickerSearch,
    setShowPicker,
    setPickerHighlighted,
  } = useGoalEditorState();

  return (
    <div className="goal-input">
      {/* Add button */}
      {!isAdding && (
        <button
          type="button"
          onClick={openAdd}
          className="goal-input__add-btn mb-2"
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
