import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import ListDetailsPanel from "../components/ListDetailsPanel";
import { todoPlaintext, todoJSON } from "./navigator";
import { isInjectionLike, extractValidatedTodo } from "./chat_helpers";
import SpeechService from "./speech";


export default function Chat() {
  const [mainView, setMainView] = useState("chat"); // "chat" or "listDetail"
  const [activeListName, setActiveListName] = useState(null);

  const [chatMode, setChatMode] = useState("query");
  const [heroText, setHeroText] = useState("What's on the schedule this week?");
  const [query, setQuery] = useState("");
  const [responseList, setResponseList] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pastQueries, setPastQueries] = useState([]);
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


  /////////////////////////////////////////
  // Pull previously sent queries on mount //
  /////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["pastFiveQueries"], (result) => {
      setPastQueries(result.pastFiveQueries || []);
    });
  }, []);


  //////////////////////////////
  // Initialize speech service //
  //////////////////////////////
  useEffect(() => {
    speechRef.current = new SpeechService();

    speechRef.current.onTranscript((text) => {
      setLiveTranscript(text);
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

    const updatedQueries = [query, ...pastQueries].slice(0, 5);
    setPastQueries(updatedQueries);
    chrome.storage?.local.set({ pastFiveQueries: updatedQueries });

    console.log("Sending:", query);
    setHeroText("Processing your word vomit...");

    const responsePlaintext = await todoPlaintext(query);
    const outputPlaintext = responsePlaintext.choices[0].message.content;

    setHeroText("Dang bro this week sucks...");

    let parsed;

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
    }
    
    else {
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


  //////////////////////////////////////////
  // Sidebar callbacks for view switching //
  //////////////////////////////////////////
  const handleSelectList = (listName) => {
    setActiveListName(listName);
    setMainView("listDetail");
  };


  ////////////
  // Render //
  ////////////
  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-72 p-4 border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          <Sidebar key={refreshTrigger} onSelectList={handleSelectList} />
        </div>

        {/* Right Side - Switches between Chat and List Detail */}
        {mainView === "chat" ? (
          <ChatPanel
            chatMode={chatMode}
            setChatMode={setChatMode}
            heroText={heroText}
            setHeroText={setHeroText}
            query={query}
            setQuery={setQuery}
            responseList={responseList}
            setResponseList={setResponseList}
            availableLists={availableLists}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
            contextToggle={contextToggle}
            setContextToggle={setContextToggle}
            isListening={isListening}
            handleMic={handleMic}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            handleReplace={handleReplace}
            handleAppend={handleAppend}
            handleDiscard={handleDiscard}
          />
        ) : (
          <ListDetailsPanel
            listName={activeListName}
          />
        )}
      </div>
    </div>
  );
}