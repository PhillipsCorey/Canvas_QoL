import { use, useEffect, useState } from "react";

export default function Popup() {

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
      if (isDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }, []);
  

  useEffect(() => {
    chrome.storage?.local.get(["todos"], (result) => {
      if (Array.isArray(result.todos)) setTodos(result.todos);
    });
  }, []);

  useEffect(() => {
    chrome.storage?.local.set({ todos });
  }, [todos]);

  const openChat = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("chat.html"),
    });
  };

  const openOptions = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html"),
    });
  }

  const openAPI = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("api.html"),
    });
  };

  const addTodo = () => {
    const trimmed = newTodo.trim();
    if (!trimmed) return;

    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), trimmed }
    ]);
    setNewTodo("");
  };

  const removeTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTodo();
    } 
  };

  return (
    <div className="w-64 p-4 bg-light-bg dark:bg-dark-bg text-gray-800 dark:text-gray-200 rounded-lg border border-light-border dark:border-dark-border">
      <h1 className="text-lg font-bold mb-3 text-primary">Canvas QoL</h1>
        
        <button
          onClick={openOptions}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition"
          aria-label="Open settings"
          title="Settings"
        >
          <span className="text-lg leading-none">
            ⚙️
          </span>
        </button>
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            To Do List
          </h2>
          <div className="mt-2 flex gap-2">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a task..."
              className="flex-1 px-2 py-1.5 rounded border border-light-border dark:border-dark-border bg-white/70 dark:bg-black/20 outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addTodo}
              className="px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-white transition-colors"
              aria-label="Add todo"
              title="Add"
            >
              +
            </button>
          </div>
          <div className="mt-3 max-h-40 overflow-y-auto pr-1">
            {todos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet.</p>
            ) : (
              <ul className="space-y-2">
                {todos.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded px-3 py-2"
                  >
                    <span className="text-sm">{t.trimmed}</span>
                    <button
                      onClick={() => removeTodo(t.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                      aria-label="Remove todo"
                      title="Remove"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>)}
          </div>
        </div>
        <div className="mt-2"></div>
        <div className="flex gap-2">
          <button
            onClick={openChat}
            className="w-1/2 bg-primary hover:bg-primary-hover text-white py-2 rounded transition-colors"
          >
            Open Chat
          </button>

          <button
            onClick={openAPI}
            className="w-1/2 bg-primary hover:bg-primary-hover text-white py-2 rounded transition-colors"
          >
            Open API
          </button>
        </div>
    </div>
  );
}
