import { BrainCircuit, ChevronDown, Mic, SendHorizontal, Settings } from "lucide-react";


export default function ChatPanel({
  chatMode, setChatMode, heroText, setHeroText,
  query, setQuery, responseList, setResponseList,
  availableLists, selectedList, setSelectedList,
  contextToggle, setContextToggle,
  isListening, handleMic, handleSend, handleKeyDown,
  handleReplace, handleAppend, handleDiscard,
}) {
  return (
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
                                  {item.time}
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
  );
}