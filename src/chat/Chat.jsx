import { BrainCircuit, ChevronDown, Mic, Rabbit, SendHorizontal, Settings, ToggleLeft, ToggleRight, Turtle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
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
  const [availableLists, setAvailableLists] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [contextToggle, setContextToggle] = useState(false);

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
      setQuery(text);
    });

    return () => {
      speechRef.current?.stop();
    };
  }, []);

  ///////////////////////////////////////////
  // Load available lists from localStorage //
  ///////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const data = result?.todoData || {};
      const listNames = Object.keys(data);
      setAvailableLists(listNames);
    });
  }, [refreshTrigger]);


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

    // Determine which list to replace
    const targetList = selectedList || "To Do List";

    chrome.storage?.local.get(["todoData"], (result) => {
      const todoData = result?.todoData || {};
      todoData[targetList] = responseList;
      
      chrome.storage?.local.set({ todoData }, () => {
        setRefreshTrigger(prev => prev + 1);
        setResponseList(null);
        setChatMode("query");
      });
    });
  };

  const handleAppend = () => {
    if (!responseList) return;

    // Determine which list to append to
    const targetList = selectedList || "To Do List";

    chrome.storage?.local.get(["todoData"], (result) => {
      const todoData = result?.todoData || {};
      const currentList = todoData[targetList] || [];
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

      todoData[targetList] = mergedList;
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
        <div className="w-72 p-4 border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          <Sidebar key={refreshTrigger}/>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex flex-1 flex-col bg-light-bg dark:bg-dark-bg">
          
          {/* Settings Button */}
          <div className="flex items-center justify-end px-6 py-4">
            <button
              onClick={() => {chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });}}
              className="p-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors"
              aria-label="Settings"
            >
              <Settings size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

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
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
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