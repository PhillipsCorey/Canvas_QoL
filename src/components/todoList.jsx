import { useState, useEffect } from "react";
import { ArrowLeft, CheckSquare, Square, Clock, Plus, ChevronRight, Trash2, Edit3, Check, X } from "lucide-react";

export default function TodoSidebar() {
  const [view, setView] = useState("lists"); // "lists" or "detail"
  const [allLists, setAllLists] = useState({});
  const [selectedListName, setSelectedListName] = useState(null);
  const [selectedList, setSelectedList] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [newTaskInputs, setNewTaskInputs] = useState({}); // Track input for each category
  const [editingTask, setEditingTask] = useState(null); // {catIdx, itemIdx}
  const [editingTaskData, setEditingTaskData] = useState(null);
  const [addingSubtask, setAddingSubtask] = useState(null); // {catIdx, itemIdx}
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  /////////////////////////////////
  // Load all lists from storage //
  /////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const data = result?.todoData || {};
      setAllLists(data);
    });
  }, []);


  ///////////////////////////////////
  // Calculate task count for list //
  ///////////////////////////////////
  const getTaskCount = (categories) => {
    if (!Array.isArray(categories)) return 0;
    return categories.reduce((total, cat) => {
      return total + (cat.items?.length || 0);
    }, 0);
  };


  ////////////////////////////
  // Select a list to view //
  ///////////////////////////
  const selectList = (listName) => {
    setSelectedListName(listName);
    const list = allLists[listName] || [];
    setSelectedList(list);
    setView("detail");
    
    // Default: expand all categories
    const allIndices = new Set(list.map((_, idx) => idx));
    setExpandedCategories(allIndices);
  };


  /////////////////////////////////
  // Go back to list selection //
  ////////////////////////////////
  const backToLists = () => {
    setView("lists");
    setSelectedListName(null);
    setSelectedList([]);
    setSearchQuery("");
  };


  ///////////////////////////////
  // Toggle category expansion //
  ///////////////////////////////
  const toggleCategory = (categoryIdx) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryIdx)) {
        newSet.delete(categoryIdx);
      } 
      
      else {
        newSet.add(categoryIdx);
      }
      return newSet;
    });
  };


  ////////////////////////////
  // Expand all categories //
  ///////////////////////////
  const expandAll = () => {
    const allIndices = new Set(selectedList.map((_, idx) => idx));
    setExpandedCategories(allIndices);
  };


  //////////////////////////////
  // Collapse all categories //
  /////////////////////////////
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };


  ////////////////////////////////////////////
  // Filter list based on search query //
  ///////////////////////////////////////////
  const filteredList = selectedList.map(category => {
    if (!searchQuery.trim()) return category;
    
    const query = searchQuery.toLowerCase();
    const categoryMatches = category.name.toLowerCase().includes(query);
    
    // If category name matches, return entire category
    if (categoryMatches) return category;
    
    // Otherwise filter items
    const filteredItems = category.items.filter(item => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.descr.toLowerCase().includes(query)
      );
    });
    
    // Only return category if it has matching items
    if (filteredItems.length > 0) {
      return { ...category, items: filteredItems };
    }
    
    return null;
  }).filter(cat => cat !== null);


  /////////////////////
  // Delete category //
  /////////////////////
  const deleteCategory = (categoryIdx) => {
    if (!confirm(`Delete category "${selectedList[categoryIdx].name}"?`)) return;
    
    const updated = [...selectedList];
    updated.splice(categoryIdx, 1);
    setSelectedList(updated);
    
    // Update expanded categories indices
    setExpandedCategories(prev => {
      const newSet = new Set();
      prev.forEach(idx => {
        if (idx < categoryIdx) newSet.add(idx);
        else if (idx > categoryIdx) newSet.add(idx - 1);
      });
      return newSet;
    });

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  /////////////////////////////
  // Toggle task done status //
  /////////////////////////////
  const toggleTaskDone = (categoryIdx, itemIdx) => {
    const updated = [...selectedList];
    updated[categoryIdx].items[itemIdx].done = !updated[categoryIdx].items[itemIdx].done;
    setSelectedList(updated);
    
    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  ////////////////////////////////
  // Toggle subtask done status //
  ////////////////////////////////
  const toggleSubtaskDone = (categoryIdx, itemIdx, subtaskIdx) => {
    const updated = [...selectedList];
    updated[categoryIdx].items[itemIdx].subtasks[subtaskIdx].done = 
      !updated[categoryIdx].items[itemIdx].subtasks[subtaskIdx].done;
    setSelectedList(updated);
    
    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  ////////////////////////
  // Start editing task //
  ////////////////////////
  const startEditingTask = (categoryIdx, itemIdx) => {
    setEditingTask({ catIdx: categoryIdx, itemIdx });
    setEditingTaskData({ ...selectedList[categoryIdx].items[itemIdx] });
  };


  /////////////////////////
  // Cancel editing task //
  /////////////////////////
  const cancelEditingTask = () => {
    setEditingTask(null);
    setEditingTaskData(null);
  };


  //////////////////////
  // Save edited task //
  //////////////////////
  const saveEditedTask = () => {
    if (!editingTask || !editingTaskData) return;

    const updated = [...selectedList];
    updated[editingTask.catIdx].items[editingTask.itemIdx] = editingTaskData;
    setSelectedList(updated);

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);

    setEditingTask(null);
    setEditingTaskData(null);
  };


  ////////////////////////////////
  // Add new task to category //
  ///////////////////////////////
  const addTask = (categoryIdx) => {
    const taskName = newTaskInputs[categoryIdx]?.trim();
    if (!taskName) return;

    const updated = [...selectedList];
    updated[categoryIdx].items.push({
      name: taskName,
      descr: "",
      time: "",
      done: false,
      subtasks: []
    });
    setSelectedList(updated);

    // Clear input
    setNewTaskInputs(prev => ({ ...prev, [categoryIdx]: "" }));

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  /////////////////
  // Delete task //
  /////////////////
  const deleteTask = (categoryIdx, itemIdx) => {
    const updated = [...selectedList];
    updated[categoryIdx].items.splice(itemIdx, 1);
    setSelectedList(updated);

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  /////////////////////////
  // Start adding subtask //
  /////////////////////////
  const startAddingSubtask = (categoryIdx, itemIdx) => {
    setAddingSubtask({ catIdx: categoryIdx, itemIdx });
    setNewSubtaskName("");
  };


  //////////////////////////
  // Cancel adding subtask //
  //////////////////////////
  const cancelAddingSubtask = () => {
    setAddingSubtask(null);
    setNewSubtaskName("");
  };


  /////////////////
  // Add subtask //
  /////////////////
  const addSubtask = () => {
    if (!addingSubtask || !newSubtaskName.trim()) return;

    const updated = [...selectedList];
    updated[addingSubtask.catIdx].items[addingSubtask.itemIdx].subtasks.push({
      name: newSubtaskName.trim(),
      descr: "",
      time: "",
      done: false
    });
    setSelectedList(updated);

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);

    setAddingSubtask(null);
    setNewSubtaskName("");
  };


  ////////////////////
  // Delete subtask //
  ////////////////////
  const deleteSubtask = (categoryIdx, itemIdx, subtaskIdx) => {
    const updated = [...selectedList];
    updated[categoryIdx].items[itemIdx].subtasks.splice(subtaskIdx, 1);
    setSelectedList(updated);

    // Save to storage
    const updatedAllLists = { ...allLists, [selectedListName]: updated };
    chrome.storage?.local.set({ todoData: updatedAllLists });
    setAllLists(updatedAllLists);
  };


  ////////////////
  // Lists View //
  ////////////////
  if (view === "lists") {
    return (
      <div className="flex flex-col h-full p-4">
        <h2 className="text-xl font-bold text-primary mb-4">Your Lists</h2>
        
        <div className="space-y-2 flex-1 overflow-y-auto">
          {Object.keys(allLists).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-500 dark:text-gray-400">No lists yet.</span>
            </div>
          ) : (
            Object.entries(allLists).map(([listName, categories]) => {
              const taskCount = getTaskCount(categories);
              return (
                <button
                  key={listName}
                  onClick={() => selectList(listName)}
                  className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-4 hover:border-primary transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {listName}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }


  /////////////////
  // Detail View //
  /////////////////
  return (
    <div className="flex flex-col h-full">
      
      {/* Header with back button */}
      <div className="p-4 border-b border-light-border dark:border-dark-border space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={backToLists}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-primary truncate flex-1">{selectedListName}</h2>
        </div>

        {/* Search bar */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks, categories, descriptions..."
          className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 rounded-lg outline-none text-sm"
        />

        {/* Expand/Collapse buttons */}
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="flex-1 px-3 py-1.5 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:border-primary transition-colors text-xs font-medium"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex-1 px-3 py-1.5 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:border-primary transition-colors text-xs font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Categories and tasks */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredList.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? "No matching tasks found." : "No categories in this list."}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredList.map((category, catIdx) => {
              // Find original index for proper referencing
              const originalIdx = selectedList.findIndex(c => c.name === category.name);
              const isExpanded = expandedCategories.has(originalIdx);
              
              return (
                <div key={originalIdx} className="space-y-2">
                  
                  {/* Category header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleCategory(originalIdx)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <ChevronRight 
                        size={16} 
                        className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {category.name}
                      </h3>
                    </button>
                    <button
                      onClick={() => deleteCategory(originalIdx)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>

                  {/* Tasks - shown when expanded */}
                  {isExpanded && (
                    <div className="space-y-2 pl-2">
                      
                      {/* Existing tasks */}
                      {category.items.map((item, itemIdx) => {
                        const isEditing = editingTask?.catIdx === originalIdx && editingTask?.itemIdx === itemIdx;
                        
                        return (
                          <div
                            key={itemIdx}
                            className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-3"
                          >
                            {isEditing ? (
                              
                              // Edit mode
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingTaskData.name}
                                  onChange={(e) => setEditingTaskData({ ...editingTaskData, name: e.target.value })}
                                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded outline-none text-sm"
                                  placeholder="Task name"
                                />
                                <input
                                  type="text"
                                  value={editingTaskData.descr}
                                  onChange={(e) => setEditingTaskData({ ...editingTaskData, descr: e.target.value })}
                                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded outline-none text-xs"
                                  placeholder="Description"
                                />
                                <input
                                  type="text"
                                  value={editingTaskData.time}
                                  onChange={(e) => setEditingTaskData({ ...editingTaskData, time: e.target.value })}
                                  className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded outline-none text-xs"
                                  placeholder="Duration (e.g., 30 mins)"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEditedTask}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-xs"
                                  >
                                    <Check size={14} />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditingTask}
                                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors text-xs"
                                  >
                                    <X size={14} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              
                              // View mode
                              <div className="flex items-start gap-2">
                                
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleTaskDone(originalIdx, itemIdx)}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  {item.done ? (
                                    <CheckSquare size={18} className="text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Square size={18} className="text-gray-400" />
                                  )}
                                </button>

                                {/* Task content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${
                                      item.done ? 'line-through opacity-60' : ''
                                    }`}>
                                      {item.name}
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button
                                        onClick={() => startEditingTask(originalIdx, itemIdx)}
                                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                                      >
                                        <Edit3 size={14} className="text-blue-500" />
                                      </button>
                                      <button
                                        onClick={() => deleteTask(originalIdx, itemIdx)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                      >
                                        <Trash2 size={14} className="text-red-500" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  {item.descr && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {item.descr}
                                    </p>
                                  )}

                                  {/* Time */}
                                  {item.time && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Clock size={12} className="text-blue-500" />
                                      <span className="text-xs text-blue-700 dark:text-blue-400">
                                        {item.time}
                                      </span>
                                    </div>
                                  )}

                                  {/* Subtasks */}
                                  {item.subtasks && item.subtasks.length > 0 && (
                                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                      {item.subtasks.map((subtask, subIdx) => (
                                        <div key={subIdx} className="flex items-center gap-2 group">
                                          <button
                                            onClick={() => toggleSubtaskDone(originalIdx, itemIdx, subIdx)}
                                            className="flex-shrink-0"
                                          >
                                            {subtask.done ? (
                                              <CheckSquare size={14} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </button>
                                          <span className={`text-xs text-gray-700 dark:text-gray-300 flex-1 ${
                                            subtask.done ? 'line-through opacity-60' : ''
                                          }`}>
                                            {subtask.name}
                                          </span>
                                          <button
                                            onClick={() => deleteSubtask(originalIdx, itemIdx, subIdx)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all"
                                          >
                                            <Trash2 size={12} className="text-red-500" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add subtask */}
                                  {addingSubtask?.catIdx === originalIdx && addingSubtask?.itemIdx === itemIdx ? (
                                    <div className="mt-2 flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newSubtaskName}
                                        onChange={(e) => setNewSubtaskName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") addSubtask();
                                          if (e.key === "Escape") cancelAddingSubtask();
                                        }}
                                        placeholder="Subtask name..."
                                        className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded outline-none text-xs"
                                        autoFocus
                                      />
                                      <button
                                        onClick={addSubtask}
                                        className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        onClick={cancelAddingSubtask}
                                        className="p-1 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startAddingSubtask(originalIdx, itemIdx)}
                                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                                    >
                                      <Plus size={12} />
                                      Add subtask
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add new task input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTaskInputs[originalIdx] || ""}
                          onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [originalIdx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTask(originalIdx);
                          }}
                          placeholder="Add task..."
                          className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 rounded-lg outline-none text-sm"
                        />
                        <button
                          onClick={() => addTask(originalIdx)}
                          className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}