import { ChevronDown, Mic, SendHorizontal, Settings } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import TodoList from "../components/todoList";
import { todoPlaintext, todoJSON } from "./navigator";
import { isInjectionLike, extractValidatedTodo } from "./chat_helpers";

import SpeechService from "./speech";

export default function Chat() {
  const [chatMode, setChatMode] = useState("query");
  const [heroText, setHeroText] = useState("What's on the schedule this week?");
  const [query, setQuery] = useState("");
  const [responseList, setResponseList] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pastQueries, setPastQueries] = useState([])

  const speechRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

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

      if (isDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });
  }, []);

  ///////////////////////////////////////
  // Pull previously sent queries on mount  //
  ///////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["pastFiveQueries"], (result) => {
      setPastQueries(result.pastFiveQueries || []);
    });
  }, []);

  useEffect(() => {
    speechRef.current = new SpeechService();

    speechRef.current.onTranscript((text) => {
      setLiveTranscript(text); // store live transcript
    });

    return () => {
      speechRef.current?.stop();
    };
  }, []);

  ////////////////////////////////
  // Send the user query to LLM //
  ////////////////////////////////
const handleSend = async () => {
  if (!query.trim()) return;

  setQuery("");

  if (isInjectionLike(query)) {
    setHeroText("Nice try.");
    return;
  }

  // update history (max 5)
  const updatedQueries = [query, ...pastQueries].slice(0, 5);

  setPastQueries(updatedQueries);

  chrome.storage?.local.set({
    pastFiveQueries: updatedQueries
  });

  console.log("Sending:", query);
  setHeroText("Processing your word vomit...");

  const responsePlaintext = await todoPlaintext(query);
  const outputPlaintext = responsePlaintext.choices[0].message.content;

  setHeroText("Dang bro this week sucks...");

  let parsed;

  // The JSON formatting step sometimes drifts, so we attempt this 3 times
  // and retry if the output was malformed.
  for (let attempt = 0; attempt < 3; attempt++) {
    const responseJSON = await todoJSON(outputPlaintext);
    const validated = extractValidatedTodo(responseJSON);
    if (validated) {
      parsed = validated;
      break;
    }
  }

  if (!parsed) {
    setHeroText("Couldn't parse the response. Try again.");
    return;
  }

  setResponseList(parsed.todo);
  setChatMode("result");
  setHeroText("What's on the schedule this week?");
  setQuery("");
};


  ////////////////////////
  // Handle voice input //
  ////////////////////////
  const handleMic = () => {
    console.log("Mic clicked");
    if (!speechRef.current) return;

    if (isListening) {
      speechRef.current.stop();
      setIsListening(false);

      const finalTranscript = speechRef.current.getTranscript().trim();
      if (finalTranscript) setQuery(finalTranscript);

    } else {
      speechRef.current.resetTranscript();
      setLiveTranscript("");
      speechRef.current.start();
      setIsListening(true);
    }
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


  /////////////////////////////////////////
  // Handler for response action buttons //
  /////////////////////////////////////////
  const handleReplace = () => {
    if (!responseList) return;

    const todoData = { "To Do List": responseList };
    chrome.storage?.local.set({ todoData }, () => {
      setRefreshTrigger(prev => prev + 1);
      setResponseList(null);
      setChatMode("query");
    });
  };

  const handleAppend = () => {
    if (!responseList) return;

    chrome.storage?.local.get(["todoData"], (result) => {
      const currentList = result?.todoData?.["To Do List"] || [];
      const mergedList = [...currentList];

      responseList.forEach(newCategory => {
        const existingCategoryIndex = mergedList.findIndex(
          cat => cat.name.toLowerCase() === newCategory.name.toLowerCase()
        );

        if (existingCategoryIndex >= 0) {
          mergedList[existingCategoryIndex].items.push(...newCategory.items);
        }
        
        else {
          mergedList.push(newCategory);
        }
      });

      const todoData = { "To Do List": mergedList};
      chrome.storage?.local.set({ todoData }, () => {
        setRefreshTrigger(prev => prev + 1);
        setResponseList(null);
        setChatMode("query");
      });
    });
  };

  const handleDiscard = () => {
    setResponseList(null);
    setChatMode("query");
  };

  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[350px] p-4 border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          <TodoList key={refreshTrigger}/>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-primary">Canvas QoL</h1>
            <button
              onClick={() => {chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });}}
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
                      <Mic size={20} className={isListening ? "text-red-500" : "text-gray-600 dark:text-gray-200"}/>
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

            {chatMode === "result" && responseList && (
              <div className="flex w-full flex-col space-y-4 items-center mb-[150px] max-w-4xl">
                <span className="font-bold text-4xl text-primary text-center mb-2">Generated To-Do List</span>
                
                {/* Display the generated list */}
                <div className="w-full max-h-[400px] overflow-y-auto bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg p-4">
                  <div className="space-y-3">
                    {responseList.map((category, catIdx) => (
                      <div key={catIdx} className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                          {category.name}
                        </h3>
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {item.name}
                                  </span>
                                  {item.time && (
                                    <span className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                      ⏱ {item.time}
                                    </span>
                                  )}
                                </div>
                                {item.descr && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.descr}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleReplace}
                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors font-medium"
                  >
                    Replace List
                  </button>
                  <button
                    onClick={handleAppend}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Append to List
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}