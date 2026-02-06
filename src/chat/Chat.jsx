import { Mic, SendHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export default function Chat() {
  const [query, setQuery] = useState("");

  //////////////////////////////////////////////////////////////////
  // Check browswer or OS dark mode prefrence and default to that //
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);


  ////////////////////////////////
  // Send the user query to LLM //
  ////////////////////////////////
  const handleSend = () => {
    if (query.trim()) {
      console.log("Sending:", query);

      // TODO: LLM query logic

      setQuery("");
    }
  };


  ////////////////////////
  // Handle voice input //
  ////////////////////////
  const handleMic = () => {
    console.log("Mic clicked");
    // TODO: Mic logic
  };


  /////////////////////////////////////
  // Key detection for submit hotkey //
  /////////////////////////////////////
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[350px] border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          
          {/* Header */}
          <div className="text-center bg-light-bg-sidebar dark:bg-dark-bg-sidebar px-4 py-3">
            <span className="text-lg font-semibold text-primary mt-8">To-Do List</span>
          </div>

        </div>

        {/* Right Side - Chat Area */}
        <div className="flex flex-1 items-center justify-center bg-light-bg dark:bg-dark-bg">
          <div className="flex w-full flex-col space-y-4 items-center mb-8">
            <span className="font-bold text-4xl text-primary text-center">What's on the schedule this week?</span>
            
            {/* Input Container */}
            <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border w-[60%] px-4 py-3 rounded-lg flex items-center gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
              
              {/* Icons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMic}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={!query.trim()}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <SendHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
