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
  const [chatMode, setChatMode] = useState("query");  // "query" or "result"
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
  const [responseListName, setResponseListName] = useState("");


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


  ///////////////////////////////////////////
  // Pull previously sent queries on mount //
  ///////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["pastFiveQueries"], (result) => {
      setPastQueries(result.pastFiveQueries || []);
    });
  }, []);


  ///////////////////////////////
  // Initialize speech service //
  ///////////////////////////////
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


  ////////////////////////////////////////////
  // Load available lists from localStorage //
  ////////////////////////////////////////////
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

    if (isInjectionLike(query)) {
      setHeroText("Nice try.");
      return;
    }

    const updatedQueries = [query, ...pastQueries].slice(0, 5);
    setPastQueries(updatedQueries);
    chrome.storage?.local.set({ pastFiveQueries: updatedQueries });

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
    setResponseListName(parsed.name || "");
    setChatMode("result");
    setHeroText("What's on the schedule this week?");
    setQuery("");
  };


  ////////////////////////
  // Handle voice input //
  ////////////////////////
  const handleMic = () => {
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
  const handleReplace = (name) => {
    if (!responseList) return;

    const targetList = name || selectedList || "Your New List";

    chrome.storage?.local.get(["todoData", "todoTimestamps"], (result) => {
      const todoData = result?.todoData || {};
      todoData[targetList] = responseList;

        const timestamps = result?.todoTimestamps || {};
        timestamps[targetList] = Date.now();
        chrome.storage?.local.set({ todoData, todoTimestamps: timestamps }, () => {
        setRefreshTrigger(prev => prev + 1);
        setResponseList(null);
        setChatMode("query");
        setActiveListName(targetList);
        setMainView("listDetail");
      });
    });
  };

  const handleDiscard = () => {
    setResponseList(null);
    setChatMode("query");
    setSelectedList("");
  };


  //////////////////////////////////////////
  // Sidebar callbacks for view switching //
  //////////////////////////////////////////
  const handleSelectList = (listName) => {
    setActiveListName(listName);
    setMainView("listDetail");
  };

  const handleSelectNewList = () => {
    setActiveListName(null);
    setMainView("chat");
    setSelectedList("");
  };

  const showQueryWithContext = (listName) => {
    setActiveListName(null);
    setMainView("chat");
    setSelectedList(listName);
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
          <Sidebar key={refreshTrigger} onSelectList={handleSelectList} onSelectNewList={handleSelectNewList}/>
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
            lastQuery={pastQueries[0]}
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
            handleDiscard={handleDiscard}
            responseListName={responseListName}
          />
        ) : (
          <ListDetailsPanel
            listName={activeListName}
            showQueryWithContext={showQueryWithContext}
            onListUpdated={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}
      </div>
    </div>
  );
}