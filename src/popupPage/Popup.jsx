import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

export default function Popup() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editingItem, setEditingItem] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);

  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

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
    chrome.storage?.local.get(["todos"], (result) => {
      const normalized = normalizeTodos(result?.todos);
      setTodos(normalized);
      chrome.storage?.local.set({ todos: normalized });
    });
  }, []);

  useEffect(() => {
    chrome.storage?.local.set({ todos });
  }, [todos]);

  useEffect(() => {
    const categoryNames = todos.map(cat => cat.name).filter(name => name && name.trim() !== "");
    if (categoryNames.length === 0 && selectedCategory === "") {
      setSelectedCategory("New");
    }
  }, [todos, selectedCategory]);

  const openChat = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("chat.html") });
  };

  const openOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  };

  const openAPI = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("api.html") });
  };

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
    // main box
    <div className="w-96 h-[600px] flex flex-col bg-light-bg dark:bg-dark-bg">

      {/* header div */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
        <h1 className="text-xl font-bold text-primary">Canvas QoL</h1>
        <button onClick={openOptions} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* todolist area */}
      <div className="flex flex-1 flex-col px-4 py-3 overflow-hidden">
        {/* todolistbar */}
        <div className="text-center bg-light-bg-sidebar dark:bg-dark-bg-sidebar px-3 py-2 mb-3 rounded-lg border border-light-border dark:border-dark-border">
          <span className="text-lg font-bold text-primary">To Do List</span>
        </div>

        {/* task adding */}
        <div className="flex items-center gap-2 mb-3">
          {/* taskadd bar */}
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none text-sm"
          />
          {/* list select bar */}
          <select   
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer text-sm"
          >
            {/* category select */}
            {selectedCategory === "" && <option value="">Category</option>}
            {categoryNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="New">+ New</option>
          </select>
          {/* adding */}
          <button onClick={addTodo} className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
            +
          </button>
        </div>

        {/* no categories or new category selected */}
        {selectedCategory === "New" && (
          <div className="mb-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="New category name..."
              className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none text-sm"
              autoFocus
            />
          </div>
        )}

        {/* task display container */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* no tasks look */}
          {todos.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-gray-500 dark:text-gray-400">No tasks yet.</span>
            </div>
          ) : (
            // display of tasks
            <div className="space-y-3">
              {todos.map((category, catIdx) => (
                <div key={catIdx} className="space-y-2">
                  {/* display of category name */}
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {category.name}
                  </h3>

                  {/* individual category display */}
                  {category.items.map((item, itemIdx) => {
                    const itemKey = `${catIdx}-${itemIdx}`;
                    const isExpanded = expandedItems.has(itemKey);
                    const hasSubtasks = item.subtasks && item.subtasks.length > 0;
                    const isEditing = editingItem === itemKey;
                    
                    return (
                      // each categories tasks display container
                      <div key={itemIdx} className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg">
                        {/* individual task container */}
                        <div className="flex items-start gap-2 px-3 py-2">
                          <input type="checkbox" checked={item.done} onChange={() => toggleItemDone(catIdx, itemIdx)} className="mt-0.5 cursor-pointer" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* precompleted task name display */}
                              <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${item.done ? 'line-through opacity-60' : ''}`}>
                                {item.name}
                              </span>
                              {/* marked done display */}
                              {item.done && (
                                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                  ✓ Done
                                </span>
                              )}
                              {/* display if item has duration */}
                              {item.time && (
                                <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                  ⏱ {item.time}
                                </span>
                              )}
                            </div>
                            {/* display with description */}
                            {item.descr && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.descr}</p>}
                            {/* editing display including input fields for description and duration */}
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
                          {/* buttons next to task, edit, subtask expand, remove */}
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
                        {/* expanded view, second button */}
                        {isExpanded && (
                          // container
                          <div className="px-3 pb-2 pl-8 space-y-2 border-t border-light-border dark:border-dark-border pt-2">
                            {/* display of subtasks if they already exist */}
                            {hasSubtasks && (
                              <div className="space-y-2">
                                {item.subtasks.map((subtask, subIdx) => {
                                  const subtaskKey = `${itemKey}-${subIdx}`;
                                  const isEditingSubtask = editingSubtask === subtaskKey;
                                  
                                  return (
                                    <div key={subIdx} className="bg-white/30 dark:bg-black/20 rounded-lg p-2 border border-light-border/50 dark:border-dark-border/50">
                                      <div className="flex items-start gap-2">
                                        {/* subtask check box */}
                                        <input type="checkbox" checked={subtask.done} onChange={() => toggleSubtaskDone(catIdx, itemIdx, subIdx)} className="mt-0.5 cursor-pointer" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {/* subtaskname */}
                                            <span className={`text-xs font-medium text-gray-800 dark:text-gray-200 ${subtask.done ? 'line-through opacity-60' : ''}`}>
                                              {subtask.name}
                                            </span>
                                            {/* subtask completion*/}
                                            {subtask.done && (
                                              <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                                                ✓ Done
                                              </span>
                                            )}
                                            {/* subtask time if avail*/}
                                            {subtask.time && (
                                              <span className="text-xs bg-blue-500/10 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                                ⏱ {subtask.time}
                                              </span>
                                            )}
                                          </div>
                                          {/* subtask description if avail */}
                                          {subtask.descr && <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{subtask.descr}</p>}
                                          {/* editing subtask dropdown for description and duration */}
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
                                        {/* subtask editing and removal */}
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
                            {/* adding subtask default view regardless of existence or not */}
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
                      {/* end of category display container*/}
                      </div>
                    );
                  })}
                {/*  end of category */}
                </div>
              ))}
            {/* end of all categories */}
            </div>
          )}
        {/* end of task display container */}
        </div>
        {/* end of evrythign but bottom buttons */}
      </div>
      {/* bottom buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
        <button onClick={openChat} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm">
          Open Chat
        </button>
        <button onClick={openAPI} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm">
          Open API
        </button>
      </div>
    </div>
  );
}