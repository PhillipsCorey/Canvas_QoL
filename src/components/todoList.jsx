import { useState, useEffect } from "react";

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);

  const normalizeTodos = (raw) => {
    if (!Array.isArray(raw)) return [];

    return raw
      .filter((cat) => cat?.name && cat.name.trim() !== "")
      .map((cat) => ({
        ...cat,
        name: cat.name.trim(),
        items: Array.isArray(cat.items)
          ? cat.items.map((item) => ({
              ...item,
              name: item?.name ?? "",
              descr: item?.descr ?? "",
              time: item?.time ?? "",
              done: typeof item?.done === "boolean" ? item.done : false,
              subtasks: Array.isArray(item?.subtasks)
                ? item.subtasks.map((subtask) => ({
                    ...subtask,
                    name: subtask?.name ?? "",
                    descr: subtask?.descr ?? "",
                    time: subtask?.time ?? "",
                    done: typeof subtask?.done === "boolean" ? subtask.done : false,
                  }))
                : [],
            }))
          : [],
      }));
  };

  useEffect(() => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const firstList = result?.todoData?.["To Do List"] || [];
      const normalized = normalizeTodos(firstList);
      setTodos(normalized);

      const todoData = { "To Do List": normalized };
      chrome.storage?.local.set({ todoData });
    });
  }, []);

  useEffect(() => {
    const todoData = { "To Do List": todos };
    chrome.storage?.local.set({ todoData });
  }, [todos]);

  useEffect(() => {
    // Wait for todos to load, then set selectedCategory to first category
    if (todos.length > 0 && selectedCategory === "") {
      setSelectedCategory(todos[0].name);
    }
  }, [todos]);

  const addTodo = () => {
    const trimmed = newTodo.trim();
    const categoryToUse = selectedCategory === "New" ? newCategoryName.trim() : selectedCategory;
    
    if (!trimmed || !categoryToUse) return;

    const newItem = {
      name: trimmed,
      descr: "",
      time: "",
      done: false,
      subtasks: []
    };

    setTodos((prev) => {
      const updated = [...prev];
      const categoryIndex = updated.findIndex(cat => cat.name === categoryToUse);
      
      if (categoryIndex >= 0) {
        updated[categoryIndex].items.push(newItem);
      } else {
        updated.push({
          name: categoryToUse,
          items: [newItem]
        });
      }
      
      return updated;
    });
    setNewTodo("");
    setNewCategoryName("");
  };

  const addSubtask = (categoryIdx, itemIdx, subtaskName) => {
    if (!subtaskName.trim()) return;
    
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx].subtasks.push({
        name: subtaskName.trim(),
        descr: "",
        time: "",
        done: false
      });
      return updated;
    });
  };

  const toggleItemDone = (categoryIdx, itemIdx) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx].done = !updated[categoryIdx].items[itemIdx].done;
      return updated;
    });
  };

  const toggleSubtaskDone = (categoryIdx, itemIdx, subtaskIdx) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx].subtasks[subtaskIdx].done = !updated[categoryIdx].items[itemIdx].subtasks[subtaskIdx].done;
      return updated;
    });
  };

  const removeItem = (categoryIdx, itemIdx) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items.splice(itemIdx, 1);
      if (updated[categoryIdx].items.length === 0) {
        updated.splice(categoryIdx, 1);
      }
      return updated;
    });
  };

  const removeSubtask = (categoryIdx, itemIdx, subtaskIdx) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx].subtasks.splice(subtaskIdx, 1);
      return updated;
    });
  };

  const updateItem = (categoryIdx, itemIdx, field, value) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx][field] = value;
      return updated;
    });
  };

  const updateSubtask = (categoryIdx, itemIdx, subtaskIdx, field, value) => {
    setTodos((prev) => {
      const updated = [...prev];
      updated[categoryIdx].items[itemIdx].subtasks[subtaskIdx][field] = value;
      return updated;
    });
  };

  const toggleExpanded = (categoryIdx, itemIdx) => {
    const key = `${categoryIdx}-${itemIdx}`;
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const categoryNames = todos.map(cat => cat.name).filter(name => name && name.trim() !== "");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center bg-light-bg-sidebar dark:bg-dark-bg-sidebar px-3 py-2 mb-3 rounded-lg border border-light-border dark:border-dark-border">
        <span className="text-lg font-bold text-primary">To Do List</span>
      </div>

      {/* Task adding */}
      <div className="space-y-2 mb-3">
        {/* Input row with fixed widths */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="w-[50%] bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none text-sm"
          />
          <select   
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-[50%] bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer text-sm truncate"
          >
            {categoryNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="">+ New</option>
          </select>
        </div>

        {/* New category input - shown when "New" is selected */}
        {selectedCategory === "" && (
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New category name..."
            className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none text-sm"
            autoFocus
          />
        )}

        {/* Add button - full width at bottom */}
        <button 
          onClick={addTodo} 
          className="w-full bg-primary hover:bg-primary-hover text-white py-1.5 rounded-lg transition-colors text-sm"
        >
          + Add Task
        </button>
      </div>

      {/* Task display */}
      <div className="flex-1 overflow-y-auto pr-1">
        {todos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">No tasks yet.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map((category, catIdx) => (
              <div key={catIdx} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  {category.name}
                </h3>

                {category.items.map((item, itemIdx) => {
                  const itemKey = `${catIdx}-${itemIdx}`;
                  const isExpanded = expandedItems.has(itemKey);
                  const hasSubtasks = item.subtasks && item.subtasks.length > 0;
                  const isEditing = editingItem === itemKey;
                  
                  return (
                    <div key={itemIdx} className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg">
                      <div className="flex items-start gap-2 px-3 py-2">
                        <input type="checkbox" checked={item.done} onChange={() => toggleItemDone(catIdx, itemIdx)} className="mt-0.5 cursor-pointer" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${item.done ? 'line-through opacity-60' : ''}`}>
                              {item.name}
                            </span>
                            {item.done && (
                              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                ✓ Done
                              </span>
                            )}
                            {item.time && (
                              <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                ⏱ {item.time}
                              </span>
                            )}
                          </div>
                          {item.descr && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.descr}</p>}
                          {isEditing && (
                            <div className="mt-2 space-y-1">
                              <input
                                type="text"
                                placeholder="Description..."
                                value={item.descr}
                                onChange={(e) => updateItem(catIdx, itemIdx, 'descr', e.target.value)}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg outline-none text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Duration (e.g., 30 mins, 2 hrs)..."
                                value={item.time}
                                onChange={(e) => updateItem(catIdx, itemIdx, 'time', e.target.value)}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg outline-none text-xs"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditingItem(isEditing ? null : itemKey)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-xs">
                            {isEditing ? "✓" : "✎"}
                          </button>
                          <button onClick={() => toggleExpanded(catIdx, itemIdx)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-xs">
                            {isExpanded ? "▼" : "▶"}
                          </button>
                          <button onClick={() => removeItem(catIdx, itemIdx)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-xs text-red-500">
                            ×
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-2 pl-8 space-y-2 border-t border-light-border dark:border-dark-border pt-2">
                          {hasSubtasks && (
                            <div className="space-y-2">
                              {item.subtasks.map((subtask, subIdx) => {
                                const subtaskKey = `${itemKey}-${subIdx}`;
                                const isEditingSubtask = editingSubtask === subtaskKey;
                                
                                return (
                                  <div key={subIdx} className="bg-white/30 dark:bg-black/20 rounded-lg p-2 border border-light-border/50 dark:border-dark-border/50">
                                    <div className="flex items-start gap-2">
                                      <input type="checkbox" checked={subtask.done} onChange={() => toggleSubtaskDone(catIdx, itemIdx, subIdx)} className="mt-0.5 cursor-pointer" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-xs font-medium text-gray-800 dark:text-gray-200 ${subtask.done ? 'line-through opacity-60' : ''}`}>
                                            {subtask.name}
                                          </span>
                                          {subtask.done && (
                                            <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                              ✓ Done
                                            </span>
                                          )}
                                          {subtask.time && (
                                            <span className="text-xs bg-blue-500/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                              ⏱ {subtask.time}
                                            </span>
                                          )}
                                        </div>
                                        {subtask.descr && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{subtask.descr}</p>}
                                        {isEditingSubtask && (
                                          <div className="mt-2 space-y-1">
                                            <input
                                              type="text"
                                              placeholder="Description..."
                                              value={subtask.descr}
                                              onChange={(e) => updateSubtask(catIdx, itemIdx, subIdx, 'descr', e.target.value)}
                                              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg outline-none text-xs"
                                            />
                                            <input
                                              type="text"
                                              placeholder="Duration..."
                                              value={subtask.time}
                                              onChange={(e) => updateSubtask(catIdx, itemIdx, subIdx, 'time', e.target.value)}
                                              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg outline-none text-xs"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => setEditingSubtask(isEditingSubtask ? null : subtaskKey)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-xs">
                                          {isEditingSubtask ? "✓" : "✎"}
                                        </button>
                                        <button onClick={() => removeSubtask(catIdx, itemIdx, subIdx)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-xs text-red-500">
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex items-center gap-1 pt-1">
                            <input
                              type="text"
                              placeholder="Add subtask..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addSubtask(catIdx, itemIdx, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-2 py-1 rounded-lg outline-none text-xs"
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                addSubtask(catIdx, itemIdx, input.value);
                                input.value = '';
                              }}
                              className="px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}