import { Moon, Sun, Download, Upload } from "lucide-react";
import { useEffect, useState } from "react";

export default function Options() {
  const [darkMode, setDarkMode] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  
  //////////////////////////////////////////////////////////////////
  // Check browswer or OS dark mode prefrence and default to that //
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["darkMode"], (result) => {
      let isDarkMode;
      if (result.darkMode !== undefined) {
        isDarkMode = result.darkMode;
      }
      
      else {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setDarkMode(isDarkMode);
      if (isDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });
  }, []);


  //////////////////////
  // Dark mode toggle //
  //////////////////////
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Save preference to chrome.storage
    chrome.storage?.local.set({ darkMode: newMode }, () => {
      if (newMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });
  };


  //////////////////////
  // Debug JSON tools //
  //////////////////////
  const handleExport = () => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const jsonString = JSON.stringify(result.todoData, null, 2);
      
      // Create download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todoData.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          chrome.storage?.local.set({ todoData: imported }, () => {
            alert("Data imported successfully!");
          });
        } catch (error) {
          alert("Invalid JSON file!");
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  
  ///////////////////
  // API key stuff //
  ///////////////////
  const handleSaveApiKey = () => {
    chrome.storage?.local.set({ apiKey }, () => {
      setApiKeySaved(true);
      setTimeout(() => {
        setApiKeySaved(false);
      }, 1500);
    });
  };

  useEffect(() => {
    chrome.storage?.local.get(["apiKey"], (result) => {
      if (result.apiKey) {
        setApiKey(result.apiKey);
      }
    });
  }, []);


  return (
    <div className="flex h-screen w-screen flex-col bg-light-bg dark:bg-dark-bg">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between my-8">
            <h1 className="text-3xl font-bold text-primary mx-auto">Settings</h1>
          </div>

          {/* Dark Mode Toggle */}
          <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dark Mode</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toggle between light and dark theme</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">API Key</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter your Navigator API key</p>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key..."
                className="flex-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-4 py-2 rounded-lg outline-none"
              />
              <button
                onClick={handleSaveApiKey}
                className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium ${
                  apiKeySaved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-primary hover:bg-primary-hover'
                } text-white`}
              >
                {apiKeySaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Debug Section */}
          <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Debug Tools</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Export or import your todo list data</p>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Download size={18} />
                Export JSON
              </button>
              <button
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                <Upload size={18} />
                Import JSON
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}