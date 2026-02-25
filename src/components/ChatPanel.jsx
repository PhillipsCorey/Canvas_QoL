import { useState } from "react";
import {
  BrainCircuit, ChevronDown, ChevronRight, Mic, SendHorizontal, Settings,
  Clock, Calendar, CheckSquare, Square, Pencil,
} from "lucide-react";


export default function ChatPanel({
  chatMode, setChatMode, heroText, setHeroText,
  query, setQuery, responseList, responseListName, setResponseList,
  availableLists, selectedList, setSelectedList,
  contextToggle, setContextToggle,
  isListening, lastQuery, handleMic, handleSend, handleKeyDown,
  handleReplace, handleDiscard,
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);


  ////////////////////////////////////////////
  // Initialize expanded state on response //
  ///////////////////////////////////////////
  if (responseList && !hasInitialized) {
    const allCats = new Set(responseList.map((_, idx) => idx));
    const allTasks = new Set();
    responseList.forEach((cat, catIdx) => {
      cat.items.forEach((_, itemIdx) => {
        allTasks.add(`${catIdx}-${itemIdx}`);
      });
    });
    setExpandedCategories(allCats);
    setExpandedTasks(allTasks);
    setHasInitialized(true);

    // Prefill list name from response or fallback
    if (!selectedList) {
      setNewListName(responseListName || "Your New List");
    }
  }


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


  ///////////////////////////////////
  // Get subtask completion stats //
  //////////////////////////////////
  const getSubtaskStats = (item) => {
    if (!item.subtasks || item.subtasks.length === 0) return null;
    const total = item.subtasks.length;
    const done = item.subtasks.filter((s) => s.done).length;
    return { total, done };
  };


  ////////////////////////////////////////
  // Get completion stats for category //
  ///////////////////////////////////////
  const getCategoryStats = (category) => {
    const total = category.items.length;
    const done = category.items.filter((item) => item.done).length;
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


  //////////////////////////////////////////
  // Accept new list with optional rename //
  //////////////////////////////////////////
  const handleAcceptNewList = () => {
    const name = newListName.trim() || "To Do List";
    handleReplace(name);
    setNewListName("");
    setIsEditingName(false);
  };


  //////////////////////////////
  // Accept changes to list  //
  /////////////////////////////
  const handleAcceptChanges = () => {
    handleReplace();
  };


  //////////////////////////
  // Edit prompt (retry) //
  /////////////////////////
  const handleEditPrompt = () => {
    setQuery(lastQuery || "");
    setResponseList(null);
    setChatMode("query");
    setNewListName("");
    setIsEditingName(false);
  };


  /////////////////////
  // Cancel / reset //
  ////////////////////
  const handleCancel = () => {
    handleDiscard();
    setNewListName("");
    setIsEditingName(false);
  };


  //////////////
  // Render  //
  /////////////
  return (
    <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg">

      {/* Center Content */}
      <div className="flex flex-1 items-center justify-center">
        {chatMode === "query" && (
          <div className="flex w-full flex-col space-y-5 items-center mb-32">
            <span className="font-bold text-4xl text-primary text-center">{heroText}</span>

            {/* Input Container */}
            <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border w-[60%] px-4 pt-3 rounded-lg flex flex-col gap-3">
              {/* Text input */}
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="w-full mt-2 bg-transparent outline-none text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[24px] max-h-[200px]"
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />

              {/* Toggle and action buttons */}
              <div className="flex items-center justify-between -mt-2 mb-2">
                {/* Toggle */}
                <button
                  onClick={() => setContextToggle(!contextToggle)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${
                    contextToggle 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <BrainCircuit size={18} className="rotate-90"/>
                  <span className="text-xs font-medium mb-0.5">Deep Think</span>
                </button>

                {/* List selector, Mic and Send */}
                <div className="flex items-center">
                  {/* List Context Selector */}
                  <div className="relative">
                    <select
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.target.value)}
                      className="appearance-none bg-transparent text-gray-800 dark:text-gray-300 pr-6 pl-2 py-1 rounded-md outline-none cursor-pointer text-xs"
                    >
                      <option value="">Create a new list</option>
                      {availableLists.map(listName => (
                        <option key={listName} value={listName}>{listName}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 pointer-events-none" />
                  </div>

                  <button
                    onClick={handleMic}
                    className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="Voice input"
                  >
                    <Mic size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={!query.trim()}
                    className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send message"
                  >
                    <SendHorizontal size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chatMode === "result" && responseList && (
          <div className="flex w-full flex-col items-center mb-[150px] max-w-4xl px-4">
            <span className="font-bold text-3xl text-primary text-center mb-6">Generated To-Do List</span>

            {/* Response list display (mirrors ListDetailPanel) */}
            <div className="w-full space-y-3 max-h-[500px] overflow-y-auto">
              {responseList.map((category, catIdx) => {
                const stats = getCategoryStats(category);
                const isExpanded = expandedCategories.has(catIdx);

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
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {category.name}
                        </span>
                      </div>

                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        {stats.done}/{stats.total}
                      </span>
                    </div>

                    {/* Category items */}
                    {isExpanded && (
                      <div className="px-4 py-2 space-y-2">
                        {category.items.map((item, itemIdx) => {
                          const taskKey = `${catIdx}-${itemIdx}`;
                          const isTaskExpanded = expandedTasks.has(taskKey);
                          const subStats = getSubtaskStats(item);

                          return (
                            <div
                              key={itemIdx}
                              className="border border-light-border dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg"
                            >
                              {/* Task top row */}
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5 flex-shrink-0">
                                  {item.done ? (
                                    <CheckSquare size={18} className="text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Square size={18} className="text-gray-400" />
                                  )}
                                </span>

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
                                      <span className={`text-[10px] text-gray-400 dark:text-gray-500 ${
                                        !item.date && !item.time ? "mt-1" : ""
                                      }`}>
                                        {subStats.done}/{subStats.total} subtasks
                                      </span>
                                    )}
                                  </div>
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
                                        <div key={subIdx} className="flex items-center gap-2">
                                          <span className="flex-shrink-0">
                                            {subtask.done ? (
                                              <CheckSquare size={14} className="text-primary" />
                                            ) : (
                                              <Square size={14} className="text-gray-400" />
                                            )}
                                          </span>
                                          <span className={`text-xs text-gray-700 dark:text-gray-300 flex-1 ${
                                            subtask.done ? "line-through opacity-60" : ""
                                          }`}>
                                            {subtask.name}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action buttons — branched by new list vs existing list */}
            <div className="flex flex-col items-center gap-3 mt-6 w-full">

              {/* New list: name input */}
              {!selectedList && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    New List Name:
                  </span>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAcceptNewList();
                    }}
                    placeholder="Your New List"
                    className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none w-56"
                  />
                </div>
              )}

              {/* Action buttons row */}
              <div className="flex gap-3">
                {!selectedList ? (
                  <>
                    <button
                      onClick={handleAcceptNewList}
                      className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium"
                    >
                      Save List
                    </button>
                    <button
                      onClick={handleEditPrompt}
                      className="px-6 py-2 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Edit Prompt
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAcceptChanges}
                      className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium"
                    >
                      Accept Changes
                    </button>
                    <button
                      onClick={handleEditPrompt}
                      className="px-6 py-2 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Edit Prompt
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}