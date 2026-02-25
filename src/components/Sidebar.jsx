import { useState, useEffect, useRef } from "react";
import { Plus, Search, Settings } from "lucide-react";
import ListRowItem from "./ListRowItem";


export default function Sidebar({ onSelectList, onSelectNewList }) {
  const [allLists, setAllLists] = useState({});
  const [favorites, setFavorites] = useState(new Set());
  const [hoveredList, setHoveredList] = useState(null);
  const [menuOpenList, setMenuOpenList] = useState(null);
  const [renamingList, setRenamingList] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [listTimestamps, setListTimestamps] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);  // listName to del
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);


  /////////////////////////////////
  // Load all lists from storage //
  /////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["todoData", "todoFavorites", "todoTimestamps"], (result) => {
      const data = result?.todoData || {};
      const favs = result?.todoFavorites || [];
      const timestamps = result?.todoTimestamps || {};
      setAllLists(data);
      setFavorites(new Set(favs));
      setListTimestamps(timestamps);
    });
  }, []);


  //////////////////////////////////////////
  // Close ellipsis menu on outside click //
  //////////////////////////////////////////
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenList(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  //////////////////////////////////////////
  // Sort list names by last edited time //
  /////////////////////////////////////////
  const sortByRecency = (names) => {
    return [...names].sort((a, b) => {
      const tA = listTimestamps[a] || 0;
      const tB = listTimestamps[b] || 0;
      return tB - tA;
    });
  };


  /////////////////////////
  // Get favorite lists //
  ////////////////////////
  const getFavoriteListNames = () => {
    return sortByRecency(Object.keys(allLists).filter((name) => favorites.has(name)));
  };


  ///////////////////////
  // Get recent lists //
  //////////////////////
  const getRecentListNames = () => {
    return sortByRecency(Object.keys(allLists).filter((name) => !favorites.has(name)));
  };


  //////////////////////
  // Create new list //
  /////////////////////
  const handleNewList = () => {
    onSelectNewList?.();
  };


  ///////////////////
  // Search lists //
  //////////////////
  const handleSearch = () => {
    setSearchOpen(true);
    setSearchQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };


  ///////////////////////////////////////////////
  // Deep search all lists for matching string //
  ///////////////////////////////////////////////
  const getSearchResults = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return Object.keys(allLists).filter((listName) => {
      // Check list name
      if (listName.toLowerCase().includes(query)) return true;

      // Check all nested content
      const categories = allLists[listName] || [];
      return categories.some((cat) => {
        if (cat.name?.toLowerCase().includes(query)) return true;

        return cat.items?.some((item) => {
          if (item.name?.toLowerCase().includes(query)) return true;
          if (item.descr?.toLowerCase().includes(query)) return true;
          if (item.date?.toLowerCase().includes(query)) return true;
          if (item.time?.toLowerCase().includes(query)) return true;

          return item.subtasks?.some((sub) => {
            if (sub.name?.toLowerCase().includes(query)) return true;
            if (sub.time?.toLowerCase().includes(query)) return true;
            return false;
          });
        });
      });
    });
  };

  const handleSearchSelect = (listName) => {
    closeSearch();
    handleSelectList(listName);
  };


  ///////////////////////
  // Open preferences //
  //////////////////////
  const handlePreferences = () => {
    console.log("Open preferences");
  };


  ////////////////////
  // Select a list //
  ///////////////////
  const handleSelectList = (listName) => {
    onSelectList?.(listName);
  };


  //////////////////////
  // Favorite a list //
  /////////////////////
  const handleFavorite = (listName) => {
    setFavorites((prev) => {
      const newFavs = new Set(prev);
      if (newFavs.has(listName)) {
        newFavs.delete(listName);
      } 
      
      else {
        newFavs.add(listName);
      }

      chrome.storage?.local.set({ todoFavorites: [...newFavs] });
      return newFavs;
    });
    setMenuOpenList(null);
  };


  ////////////////////
  // Rename a list //
  ///////////////////
  const handleStartRename = (listName) => {
    setRenamingList(listName);
    setRenameValue(listName);
    setMenuOpenList(null);
  };

  const handleConfirmRename = () => {
    const oldName = renamingList;
    const newName = renameValue.trim();

    if (!oldName || !newName || oldName === newName) {
      setRenamingList(null);
      setRenameValue("");
      return;
    }

    chrome.storage?.local.get(["todoData", "todoTimestamps", "todoFavorites"], (result) => {
      const todoData = result?.todoData || {};
      const timestamps = result?.todoTimestamps || {};
      const favs = new Set(result?.todoFavorites || []);

      // Move list data to new key
      todoData[newName] = todoData[oldName];
      delete todoData[oldName];

      // Move timestamp
      if (timestamps[oldName]) {
        timestamps[newName] = timestamps[oldName];
        delete timestamps[oldName];
      }

      // Move favorite
      if (favs.has(oldName)) {
        favs.delete(oldName);
        favs.add(newName);
      }

      chrome.storage?.local.set({
        todoData,
        todoTimestamps: timestamps,
        todoFavorites: [...favs],
      }, () => {
        setAllLists(todoData);
        setListTimestamps(timestamps);
        setFavorites(favs);
        setRenamingList(null);
        setRenameValue("");
      });
    });
  };

  const handleCancelRename = () => {
    setRenamingList(null);
    setRenameValue("");
  };


  ////////////////////
  // Delete a list //
  ///////////////////
  const handleDeleteList = (listName) => {
    setMenuOpenList(null);
    setDeleteModal(listName);
  };

  const confirmDeleteList = () => {
    const listName = deleteModal;
    if (!listName) return;

    chrome.storage?.local.get(["todoData", "todoTimestamps", "todoFavorites"], (result) => {
      const todoData = result?.todoData || {};
      const timestamps = result?.todoTimestamps || {};
      const favs = new Set(result?.todoFavorites || []);

      delete todoData[listName];
      delete timestamps[listName];
      favs.delete(listName);

      chrome.storage?.local.set({
        todoData,
        todoTimestamps: timestamps,
        todoFavorites: [...favs],
      }, () => {
        setAllLists(todoData);
        setListTimestamps(timestamps);
        setFavorites(favs);
        setDeleteModal(null);
      });
    });
  };


  ///////////////////////
  // Toggle menu open //
  //////////////////////
  const toggleMenu = (e, listName) => {
    e.stopPropagation();
    setMenuOpenList((prev) => (prev === listName ? null : listName));
  };


  /////////////
  // Render //
  ////////////
  return (
    <div className="flex flex-col h-full">

      {/* Title and Collapse Button */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-3xl font-bold text-primary tracking-tight">tasqe</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col py-4">
        <button
          onClick={handleNewList}
          className="flex items-center gap-1.5 flex-1 px-1 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="New list"
        >
          <Plus size={14} />
          New List
        </button>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 flex-1 px-1 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Search"
        >
          <Search size={14} className="text-gray-600 dark:text-gray-400" />
          Search
        </button>
        <button
          onClick={handlePreferences}
          className="flex items-center gap-1.5 flex-1 px-1 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Preferences"
        >
          <Settings size={14} className="text-gray-600 dark:text-gray-400" />
          Preferences
        </button>
      </div>

      {/* List of todo lists */}
      <div className="flex-1 overflow-y-auto py-1">
        {Object.keys(allLists).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-sm text-gray-500 dark:text-gray-400">No lists yet...</span>
            <span
              className="text-sm text-primary underline hover:text-primary-hover cursor-pointer"
              onClick={handleNewList} 
            >  
              Create a list  
            </span>
          </div>
        ) : (
          <>
            {/* Favorites section */}
            {getFavoriteListNames().length > 0 && (
              <div className="mb-2">
                <span className="px-2 ml-0.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Favorites
                </span>
                {getFavoriteListNames().map((listName) => (
                  <ListRowItem
                    key={listName}
                    listName={listName}
                    favorites={favorites}
                    hoveredList={hoveredList}
                    menuOpenList={menuOpenList}
                    renamingList={renamingList}
                    renameValue={renameValue}
                    setHoveredList={setHoveredList}
                    setMenuOpenList={setMenuOpenList}
                    setRenameValue={setRenameValue}
                    handleSelectList={handleSelectList}
                    handleFavorite={handleFavorite}
                    handleStartRename={handleStartRename}
                    handleConfirmRename={handleConfirmRename}
                    handleCancelRename={handleCancelRename}
                    handleDeleteList={handleDeleteList}
                    toggleMenu={toggleMenu}
                    menuRef={menuRef}
                  />
                ))}
              </div>
            )}

            {/* Recents section */}
            {getRecentListNames().length > 0 && (
              <div>
                <span className="px-2 ml-0.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Recents
                </span>
                {getRecentListNames().map((listName) => (
                  <ListRowItem
                    key={listName}
                    listName={listName}
                    favorites={favorites}
                    hoveredList={hoveredList}
                    menuOpenList={menuOpenList}
                    renamingList={renamingList}
                    renameValue={renameValue}
                    setHoveredList={setHoveredList}
                    setMenuOpenList={setMenuOpenList}
                    setRenameValue={setRenameValue}
                    handleSelectList={handleSelectList}
                    handleFavorite={handleFavorite}
                    handleStartRename={handleStartRename}
                    handleConfirmRename={handleConfirmRename}
                    handleCancelRename={handleCancelRename}
                    handleDeleteList={handleDeleteList}
                    toggleMenu={toggleMenu}
                    menuRef={menuRef}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings button */}
      <div className="pt-2">
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <Settings size={14} className="text-gray-600 dark:text-gray-400" />
          Settings
        </button>
      </div>

      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40">
          <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-[400px] max-h-[400px] flex flex-col overflow-hidden">

            {/* Search input */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 border border-light-border dark:border-dark-border rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") closeSearch();
                    if (e.key === "Enter") {
                      const results = getSearchResults();
                      if (results.length === 1) handleSearchSelect(results[0]);
                    }
                  }}
                  placeholder="Search all lists..."
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {searchQuery.trim() === "" ? (
                <div className="flex items-center justify-center py-6">
                  <span className="text-xs text-gray-400 dark:text-gray-400">Type to search...</span>
                </div>
              ) : getSearchResults().length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <span className="text-xs text-gray-400 dark:text-gray-400">No matching lists found.</span>
                </div>
              ) : (
                getSearchResults().map((listName) => (
                  <button
                    key={listName}
                    onClick={() => handleSearchSelect(listName)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                  >
                    {favorites.has(listName) && (
                      <span className="text-yellow-500 text-xs">★</span>
                    )}
                    <span className="truncate">{listName}</span>
                  </button>
                ))
              )}
            </div>

            {/* Close hint */}
            <div className="px-4 py-2 border-t border-light-border dark:border-dark-border">
              <span className="text-[10px] text-gray-400 dark:text-gray-400">
                Press Esc to close
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40">
          <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-80 flex flex-col overflow-hidden">

            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Delete List
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Are you sure you want to delete "{deleteModal}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteList}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}