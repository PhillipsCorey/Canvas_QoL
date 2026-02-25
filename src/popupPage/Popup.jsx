import { Settings } from "lucide-react";
import { useEffect } from "react";
import TodoList from "../components/todoList";

export default function Popup() {
  useEffect(() => {
    chrome.storage?.local.get(["darkMode"], (result) => {
      let isDarkMode;
      if (result.darkMode !== undefined) {
        isDarkMode = result.darkMode;
      }
      
      else {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });
  }, []);

  const openChat = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("chat.html") });
  };

  const openOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  };

  const openAPI = () => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const jsonString = JSON.stringify(result.todoData, null, 2);
      console.log(jsonString);
    });
  };

  return (
    <div className="w-96 h-[600px] flex flex-col bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
        <h1 className="text-xl font-bold text-primary">Canvas QoL</h1>
        <button onClick={openOptions} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors">
          <Settings size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* TodoList Component */}
      <div className="flex flex-1 flex-col px-4 py-3 overflow-hidden">
        Jeevan epic code
      </div>

      {/* Bottom buttons */}
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