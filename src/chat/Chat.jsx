import { ChevronDown, Mic, SendHorizontal, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import TodoList from "../components/todoList";

export default function Chat() {
  const [chatMode, setChatMode] = useState("query");
  const [heroText, setHeroText] = useState("What's on the schedule this week?");
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
      testQuerySubmit();

      // TODO: LLM query logic
    }
  };


  // Temp query response example
  const testQuerySubmit = () => {
    setHeroText("Processing your word vomit...");
    
    setTimeout(() => {
      setHeroText("Dang bro this week sucks...");
    }, 2000);
    
    setTimeout(() => {
      setChatMode("result");
      setHeroText("What's on the schedule this week?");
      setQuery("");
    }, 4000);

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


  /////////////////////
  // Handle settings //
  /////////////////////
  const handleSettings = () => {
    console.log("Settings clicked");
    // TODO: Settings logic
  };


  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[350px] p-4 border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          <TodoList/>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-primary">Canvas QoL</h1>
            <button
              onClick={handleSettings}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Settings"
            >
              <Settings size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Center Content */}
          <div className="flex flex-1 items-center justify-center">
            {chatMode === "query" && (
              <div className="flex w-full flex-col space-y-4 items-center mb-[150px]">
                <span className="font-bold text-4xl text-primary text-center">{heroText}</span>
                
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
                      <Mic size={20} className="text-gray-600 dark:text-gray-200" />
                    </button>
                    
                    <button
                      onClick={handleSend}
                      disabled={!query.trim()}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      <SendHorizontal size={20} className="text-gray-600 dark:text-gray-200" />
                    </button>
                  </div>
                </div>

                {/* List Context Selector */}
                <div className="relative w-[200px] self-start ml-[20%]">
                  <select
                    className="w-full appearance-none bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-gray-800 dark:text-gray-200 p-2 rounded-lg outline-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    defaultValue=""
                  >
                    <option value="" disabled>Talking about a list?</option>
                    <option value="My Week">My Week</option>
                    <option value="Dinosaur Paper">Dinosaur Paper</option>
                    {/* TODO: List current to-do lists here */}
                  </select>
                  <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-200 pointer-events-none" />
                </div>
              </div>
            )}

            {chatMode === "result" && (
              <div className="flex w-full flex-col space-y-4 items-center mb-[150px]">
                <span className="font-bold text-4xl text-primary text-center">This is a result?</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
