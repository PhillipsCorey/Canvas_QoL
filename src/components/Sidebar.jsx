import { useState, useEffect, useRef } from "react";
import { PanelLeftClose, Plus, Search, Settings } from "lucide-react";
import ListRowItem from "./ListRowItem";


export default function Sidebar({ onSelectList, onCollapse, onSelectNewList }) {
  const [allLists, setAllLists] = useState({});
  const [favorites, setFavorites] = useState(new Set());
  const [hoveredList, setHoveredList] = useState(null);
  const [menuOpenList, setMenuOpenList] = useState(null);
  const [renamingList, setRenamingList] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef(null);


  /////////////////////////////////
  // Load all lists from storage //
  /////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["todoData", "todoFavorites"], (result) => {
      const data = result?.todoData || {};
      const favs = result?.todoFavorites || [];
      setAllLists(data);
      setFavorites(new Set(favs));
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


  /////////////////////////
  // Get favorite lists //
  ////////////////////////
  const getFavoriteListNames = () => {
    return Object.keys(allLists).filter((name) => favorites.has(name));
  };


  ///////////////////////
  // Get recent lists //
  //////////////////////
  const getRecentListNames = () => {
    return Object.keys(allLists).filter((name) => !favorites.has(name));
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
    console.log("[tasqe] Open search");
  };


  ///////////////////////
  // Open preferences //
  //////////////////////
  const handlePreferences = () => {
    console.log("[tasqe] Open preferences");
  };


  ///////////////////////
  // Collapse sidebar //
  //////////////////////
  const handleCollapse = () => {
    console.log("[tasqe] Collapse sidebar");
    onCollapse?.();
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
    console.log(`[tasqe] Toggle favorite: ${listName}`);
    setFavorites((prev) => {
      const newFavs = new Set(prev);
      if (newFavs.has(listName)) {
        newFavs.delete(listName);
      } 
      
      else {
        newFavs.add(listName);
      }
      return newFavs;
    });
    setMenuOpenList(null);
  };


  ////////////////////
  // Rename a list //
  ///////////////////
  const handleStartRename = (listName) => {
    console.log(`[tasqe] Start rename: ${listName}`);
    setRenamingList(listName);
    setRenameValue(listName);
    setMenuOpenList(null);
  };

  const handleConfirmRename = () => {
    console.log(`[tasqe] Confirm rename: "${renamingList}" -> "${renameValue}"`);
    setRenamingList(null);
    setRenameValue("");
  };

  const handleCancelRename = () => {
    setRenamingList(null);
    setRenameValue("");
  };


  ////////////////////
  // Delete a list //
  ///////////////////
  const handleDeleteList = (listName) => {
    console.log(`[tasqe] Delete list: ${listName}`);
    setMenuOpenList(null);
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
        <button
          onClick={handleCollapse}
          className="p-1.5 mt-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
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
    </div>
  );
}