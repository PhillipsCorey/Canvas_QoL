import { useState, useEffect } from "react";
import {ArrowLeft, Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight, Clock, Calendar, CheckSquare, Square, BrainCog} from "lucide-react";


export default function ListDetailPanel({ listName, onBack }) {
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryIdx, setEditingCategoryIdx] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingTask, setEditingTask] = useState(null); // { catIdx, itemIdx }
  const [editingTaskData, setEditingTaskData] = useState(null);
  const [addingTaskCatIdx, setAddingTaskCatIdx] = useState(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(null); // { catIdx, itemIdx }
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [deleteModal, setDeleteModal] = useState(null); // { type, catIdx, itemIdx?, name }
  const [expandedTasks, setExpandedTasks] = useState(new Set());


  //////////////////////////////////
  // Load list data from storage //
  /////////////////////////////////
  useEffect(() => {
    if (!listName) return;

    chrome.storage?.local.get(["todoData"], (result) => {
      const data = result?.todoData || {};
      const list = data[listName] || [];
      setCategories(list);

      // Default: expand all categories
      const allIndices = new Set(list.map((_, idx) => idx));
      setExpandedCategories(allIndices);

      // Default: expand all tasks
      const allTaskKeys = new Set();
      list.forEach((cat, catIdx) => {
        cat.items.forEach((_, itemIdx) => {
          allTaskKeys.add(`${catIdx}-${itemIdx}`);
        });
      });
      setExpandedTasks(allTaskKeys);
    });
  }, [listName]);


  ////////////////////////////
  // Save to chrome storage //
  ////////////////////////////
  const saveToStorage = (updatedCategories) => {
    setCategories(updatedCategories);

    chrome.storage?.local.get(["todoData"], (result) => {
      const todoData = result?.todoData || {};
      todoData[listName] = updatedCategories;
      chrome.storage?.local.set({ todoData });
    });
  };


  ////////////////////////
  // Edit list with LLM //
  ////////////////////////
  const editList = () => {
    console.log("[tasqe] Edit this list with LLM")
  };


  ///////////////////////////////
  // Category expand/collapse //
  //////////////////////////////
  const toggleCategory = (idx) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map((_, idx) => idx)));

    const allTaskKeys = new Set();
    categories.forEach((cat, catIdx) => {
      cat.items.forEach((_, itemIdx) => {
        allTaskKeys.add(`${catIdx}-${itemIdx}`);
      });
    });
    setExpandedTasks(allTaskKeys);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
    setExpandedTasks(new Set());
  };


  //////////////////
  // Task expand //
  /////////////////
  const toggleTaskExpand = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };


  ///////////////////////
  // Add new category //
  //////////////////////
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const updated = [...categories, { name: newCategoryName.trim(), items: [] }];
    saveToStorage(updated);

    // Expand the new category
    setExpandedCategories((prev) => new Set([...prev, updated.length - 1]));

    setAddingCategory(false);
    setNewCategoryName("");
  };


  /////////////////////////
  // Edit category name //
  ////////////////////////
  const startEditingCategory = (idx) => {
    setEditingCategoryIdx(idx);
    setEditingCategoryName(categories[idx].name);
  };

  const confirmEditCategory = () => {
    if (!editingCategoryName.trim() || editingCategoryIdx === null) return;

    const updated = [...categories];
    updated[editingCategoryIdx] = { ...updated[editingCategoryIdx], name: editingCategoryName.trim() };
    saveToStorage(updated);

    setEditingCategoryIdx(null);
    setEditingCategoryName("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryIdx(null);
    setEditingCategoryName("");
  };


  //////////////////////
  // Delete category //
  /////////////////////
  const requestDeleteCategory = (catIdx) => {
    const cat = categories[catIdx];

    if (cat.items.length > 0) {
      setDeleteModal({
        type: "category",
        catIdx,
        name: cat.name,
        message: `"${cat.name}" has ${cat.items.length} task${cat.items.length > 1 ? "s" : ""}. Are you sure you want to delete it?`,
      });
    }

    else {
      confirmDeleteCategory(catIdx);
    }
  };

  const confirmDeleteCategory = (catIdx) => {
    const updated = [...categories];
    updated.splice(catIdx, 1);
    saveToStorage(updated);

    // Fix expanded indices
    setExpandedCategories((prev) => {
      const newSet = new Set();
      prev.forEach((idx) => {
        if (idx < catIdx) newSet.add(idx);
        else if (idx > catIdx) newSet.add(idx - 1);
      });
      return newSet;
    });

    setDeleteModal(null);
  };


  ////////////////////////////
  // Toggle task completion //
  ////////////////////////////
  const toggleTaskDone = (catIdx, itemIdx) => {
    const updated = [...categories];
    updated[catIdx].items[itemIdx].done = !updated[catIdx].items[itemIdx].done;
    saveToStorage(updated);
  };


  //////////////////
  // Add new task //
  //////////////////
  const handleAddTask = (catIdx) => {
    if (!newTaskName.trim()) return;

    const updated = [...categories];
    updated[catIdx].items.push({
      name: newTaskName.trim(),
      descr: "",
      date: "",
      time: "",
      done: false,
      subtasks: [],
    });
    saveToStorage(updated);

    setAddingTaskCatIdx(null);
    setNewTaskName("");
  };


  ////////////////////////
  // Start editing task //
  ////////////////////////
  const startEditingTask = (catIdx, itemIdx) => {
    setEditingTask({ catIdx, itemIdx });
    setEditingTaskData({ ...categories[catIdx].items[itemIdx] });
  };

  const saveEditedTask = () => {
    if (!editingTask || !editingTaskData) return;

    const updated = [...categories];
    updated[editingTask.catIdx].items[editingTask.itemIdx] = {
      ...editingTaskData,
      subtasks: updated[editingTask.catIdx].items[editingTask.itemIdx].subtasks,
    };
    saveToStorage(updated);

    setEditingTask(null);
    setEditingTaskData(null);
  };

  const cancelEditingTask = () => {
    setEditingTask(null);
    setEditingTaskData(null);
  };


  //////////////////
  // Delete task //
  /////////////////
  const requestDeleteTask = (catIdx, itemIdx) => {
    const task = categories[catIdx].items[itemIdx];

    if (task.subtasks && task.subtasks.length > 0) {
      setDeleteModal({
        type: "task",
        catIdx,
        itemIdx,
        name: task.name,
        message: `"${task.name}" has ${task.subtasks.length} subtask${task.subtasks.length > 1 ? "s" : ""}. Are you sure?`,
      });
    }

    else {
      confirmDeleteTask(catIdx, itemIdx);
    }
  };

  const confirmDeleteTask = (catIdx, itemIdx) => {
    const updated = [...categories];
    updated[catIdx].items.splice(itemIdx, 1);
    saveToStorage(updated);
    setDeleteModal(null);
  };


  ////////////////////////////////
  // Toggle subtask completion //
  ///////////////////////////////
  const toggleSubtaskDone = (catIdx, itemIdx, subIdx) => {
    const updated = [...categories];
    updated[catIdx].items[itemIdx].subtasks[subIdx].done =
      !updated[catIdx].items[itemIdx].subtasks[subIdx].done;
    saveToStorage(updated);
  };


  //////////////////
  // Add subtask //
  /////////////////
  const handleAddSubtask = () => {
    if (!addingSubtask || !newSubtaskName.trim()) return;

    const updated = [...categories];
    const task = updated[addingSubtask.catIdx].items[addingSubtask.itemIdx];
    if (!task.subtasks) task.subtasks = [];

    task.subtasks.push({
      name: newSubtaskName.trim(),
      done: false,
      time: "",
    });
    saveToStorage(updated);

    setAddingSubtask(null);
    setNewSubtaskName("");
  };


  /////////////////////
  // Delete subtask //
  ////////////////////
  const deleteSubtask = (catIdx, itemIdx, subIdx) => {
    const updated = [...categories];
    updated[catIdx].items[itemIdx].subtasks.splice(subIdx, 1);
    saveToStorage(updated);
  };


  ////////////////////////////////////////
  // Get completion stats for category //
  ///////////////////////////////////////
  const getCategoryStats = (category) => {
    const total = category.items.length;
    const done = category.items.filter((item) => item.done).length;
    return { total, done };
  };


  ///////////////////////////////////
  // Get subtask completion stats //
  //////////////////////////////////
  const getSubtaskStats = (item) => {
    if (!item.subtasks || item.subtasks.length === 0) return null;
    const total = item.subtasks.length;
    const done = item.subtasks.filter((s) => s.done).length;
    return { total, done };
  };


  //////////////////////////////
  // Format due date display //
  /////////////////////////////
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dateStr + "T00:00:00");
    const diffMs = due - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };


  /////////////
  // Render //
  ////////////
  return (
    <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg px-4 sm:px-4 md:px-14 lg:px-40 xl:px-64">

      {/* Header */}
      <div className="flex items-center justify-between px-7 pb-6 pt-10">
          <h2 className="text-3xl font-bold text-primary">{listName} List</h2>

        {/* Expand / Collapse controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Collapse All
          </button>
          <button
            onClick={editList}
            className="px-2.5 py-1 text-xs font-medium text-gray-300 bg-primary hover:bg-primary-hover rounded-md transition-colors"
          >
            Edit with tasqe
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">This list is empty.</span>
            <button
              onClick={() => setAddingCategory(true)}
              className="text-sm text-primary underline hover:text-primary-hover cursor-pointer mt-1"
            >
              Add a category
            </button>
          </div>
        ) : (
          categories.map((category, catIdx) => {
            const stats = getCategoryStats(category);
            const isExpanded = expandedCategories.has(catIdx);
            const isEditingCat = editingCategoryIdx === catIdx;

            return (
              <div
                key={catIdx}
                className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden"
              >

                {/* Category header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 bg-light-bg-sidebar dark:bg-dark-bg-sidebar cursor-pointer"
                  onClick={() => toggleCategory(catIdx)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
                      )}
                    </span>

                    {isEditingCat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmEditCategory();
                            if (e.key === "Escape") cancelEditCategory();
                          }}
                          className="flex-1 bg-transparent border-b border-primary text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={confirmEditCategory}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                        >
                          <Check size={14} className="text-green-600" />
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {category.name}
                      </span>
                    )}
                  </div>

                  {!isEditingCat && (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        {stats.done}/{stats.total}
                      </span>
                      <button
                        onClick={() => startEditingCategory(catIdx)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <Pencil size={12} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      </button>
                      <button
                        onClick={() => requestDeleteCategory(catIdx)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category items */}
                {isExpanded && (
                  <div className="px-4 py-2 space-y-2">
                    {category.items.map((item, itemIdx) => {
                      const isEditing = editingTask?.catIdx === catIdx && editingTask?.itemIdx === itemIdx;
                      const taskKey = `${catIdx}-${itemIdx}`;
                      const isTaskExpanded = expandedTasks.has(taskKey);
                      const subStats = getSubtaskStats(item);

                      return (
                        <div
                          key={itemIdx}
                          className="border border-light-border dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg"
                        >
                          {isEditing ? (

                            // Edit mode
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingTaskData.name}
                                onChange={(e) => setEditingTaskData({ ...editingTaskData, name: e.target.value })}
                                placeholder="Task name"
                                className="w-full bg-transparent border-b border-light-border dark:border-dark-border text-sm font-medium text-gray-800 dark:text-gray-200 outline-none pb-1"
                                autoFocus
                              />
                              <textarea
                                value={editingTaskData.descr || ""}
                                onChange={(e) => setEditingTaskData({ ...editingTaskData, descr: e.target.value })}
                                placeholder="Description (optional)"
                                className="w-full bg-transparent border border-light-border dark:border-dark-border text-xs text-gray-700 dark:text-gray-300 outline-none rounded px-2 py-1.5 resize-none"
                                rows={2}
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={12} className="text-gray-400" />
                                  <input
                                    type="date"
                                    value={editingTaskData.date || ""}
                                    onChange={(e) => setEditingTaskData({ ...editingTaskData, date: e.target.value })}
                                    className="bg-transparent border border-light-border dark:border-dark-border text-xs text-gray-700 dark:text-gray-300 outline-none rounded px-2 py-1"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={12} className="text-gray-400" />
                                  <input
                                    type="text"
                                    value={editingTaskData.time || ""}
                                    onChange={(e) => setEditingTaskData({ ...editingTaskData, time: e.target.value })}
                                    placeholder="e.g. 2h 30m"
                                    className="bg-transparent border border-light-border dark:border-dark-border text-xs text-gray-700 dark:text-gray-300 outline-none rounded px-2 py-1 w-24"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={saveEditedTask}
                                  className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs rounded transition-colors"
                                >
                                  <Check size={12} />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingTask}
                                  className="flex items-center gap-1 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                >
                                  <X size={12} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (

                            // View mode
                            <div>
                              {/* Task top row */}
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => toggleTaskDone(catIdx, itemIdx)}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  {item.done ? (
                                    <CheckSquare size={18} className="text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Square size={18} className="text-gray-400" />
                                  )}
                                </button>

                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={() => toggleTaskExpand(catIdx, itemIdx)}
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`mt-[1px] text-sm font-medium text-gray-800 dark:text-gray-200 ${
                                      item.done ? "line-through opacity-60" : ""
                                    }`}>
                                      {item.name}
                                    </span>

                                    {item.date && (
                                      <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                        <Calendar size={10} />
                                        {formatDueDate(item.date)}
                                      </span>
                                    )}

                                    {item.time && (
                                      <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                        <Clock size={10} />
                                        {item.time}
                                      </span>
                                    )}

                                    {subStats && (
                                      <span className={`text-[10px] text-gray-400 dark:text-gray-500 ${!item.date && !item.time ? "mt-1" : ""}`}>
                                        {subStats.done}/{subStats.total} subtasks
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => startEditingTask(catIdx, itemIdx)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                  >
                                    <Pencil size={12} className="text-gray-400 hover:text-blue-500" />
                                  </button>
                                  <button
                                    onClick={() => requestDeleteTask(catIdx, itemIdx)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  >
                                    <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded task details */}
                              {isTaskExpanded && (
                                <div className="mt-2 ml-7 space-y-2">

                                  {/* Description */}
                                  {item.descr && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {item.descr}
                                    </p>
                                  )}

                                  {/* Subtasks */}
                                  {item.subtasks && item.subtasks.length > 0 && (
                                    <div className="space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                                      {item.subtasks.map((subtask, subIdx) => (
                                        <div key={subIdx} className="flex items-center gap-2 group">
                                          <button
                                            onClick={() => toggleSubtaskDone(catIdx, itemIdx, subIdx)}
                                            className="flex-shrink-0"
                                          >
                                            {subtask.done ? (
                                              <CheckSquare size={14} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                          <span className={`text-xs text-gray-700 dark:text-gray-300 flex-1 ${
                                            subtask.done ? "line-through opacity-60" : ""
                                          }`}>
                                            {subtask.name}
                                          </span>

                                          <button
                                            onClick={() => deleteSubtask(catIdx, itemIdx, subIdx)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                                          >
                                            <Trash2 size={12} className="text-red-500" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add subtask */}
                                  {addingSubtask?.catIdx === catIdx && addingSubtask?.itemIdx === itemIdx ? (
                                    <div className="flex items-center gap-2 pl-3">
                                      <input
                                        type="text"
                                        value={newSubtaskName}
                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") handleAddSubtask();
                                          if (e.key === "Escape") {
                                            setAddingSubtask(null);
                                            setNewSubtaskName("");
                                          }
                                        }}
                                        placeholder="Subtask name..."
                                        className="flex-1 bg-transparent border-b border-light-border dark:border-dark-border text-xs text-gray-800 dark:text-gray-200 outline-none py-1"
                                        autoFocus
                                      />
                                      <button
                                        onClick={handleAddSubtask}
                                        className="p-1 bg-primary hover:bg-primary-hover text-white rounded transition-colors"
                                      >
                                        <Check size={12} />
                                      </button>
                                      <button
                                        onClick={() => { setAddingSubtask(null); setNewSubtaskName(""); }}
                                        className="p-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setAddingSubtask({ catIdx, itemIdx }); setNewSubtaskName(""); }}
                                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors pl-3"
                                    >
                                      <Plus size={12} />
                                      Add subtask
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add task input */}
                    {addingTaskCatIdx === catIdx ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(catIdx);
                            if (e.key === "Escape") { setAddingTaskCatIdx(null); setNewTaskName(""); }
                          }}
                          placeholder="Task name..."
                          className="flex-1 bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleAddTask(catIdx)}
                          className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setAddingTaskCatIdx(null); setNewTaskName(""); }}
                          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingTaskCatIdx(catIdx); setNewTaskName(""); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors py-1"
                      >
                        <Plus size={14} />
                        Add task
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Add category button */}
        {categories.length > 0 && (
          <>
            {addingCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") { setAddingCategory(false); setNewCategoryName(""); }
                  }}
                  placeholder="Category name..."
                  className="flex-1 bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 rounded-lg outline-none"
                  autoFocus
                />
                <button
                  onClick={handleAddCategory}
                  className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}
                  className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingCategory(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors py-1"
              >
                <Plus size={14} />
                Add category
              </button>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl p-5 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Confirm Delete
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              {deleteModal.message}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteModal.type === "category") confirmDeleteCategory(deleteModal.catIdx);
                  else if (deleteModal.type === "task") confirmDeleteTask(deleteModal.catIdx, deleteModal.itemIdx);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}