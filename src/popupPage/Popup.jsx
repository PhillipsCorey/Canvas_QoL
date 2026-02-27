import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import WeekCalendar from "../components/Calendar";
import FirstTimeSetup from "../components/Setup";

export default function Popup() {
  const [showSetup, setShowSetup] = useState(true);

  const handleSetupComplete = () => {
    chrome.storage?.local.set({ preferencesSet: true });
    setShowSetup(false);
  };

  useEffect(() => {
    chrome.storage?.local.get(["darkMode", "preferencesSet"], (result) => {
      setShowSetup(!result.preferencesSet);
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
      {/* <div className="flex flex-1 flex-col px-4 py-3 overflow-hidden">
        <WeekCalendar />
      </div> */}
      <div className="flex flex-1 flex-col px-4 py-3 overflow-hidden">
        {showSetup ? (
          <FirstTimeSetup onComplete={handleSetupComplete} />
        ) : (
          <WeekCalendar />
        )}
      </div>

      {/* Bottom buttons */}
      {!showSetup && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
          <button onClick={openChat} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm">
            Open Chat
          </button>
        </div>
    )}
      
    </div>
  );
}