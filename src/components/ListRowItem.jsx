import { MoreHorizontal, Star, Pencil, Trash2 } from "lucide-react";


//////////////////////////////
// List item sub-component //
/////////////////////////////
export default function ListRowItem({
  listName, favorites, hoveredList, menuOpenList, renamingList, renameValue,
  setHoveredList, setMenuOpenList, setRenameValue,
  handleSelectList, handleFavorite, handleStartRename, handleConfirmRename,
  handleCancelRename, handleDeleteList, toggleMenu, menuRef,
}) {
  return (
    <div
      className="relative group"
      onMouseEnter={() => setHoveredList(listName)}
      onMouseLeave={() => {
        setHoveredList(null);
        if (menuOpenList === listName) return;
      }}
    >

      {/* List item row */}
      <button
        onClick={() => {
          if (renamingList !== listName) handleSelectList(listName);
        }}
        className="w-full flex items-center justify-between px-2 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">

          {/* Rename inline input */}
          {renamingList === listName ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmRename();
                if (e.key === "Escape") handleCancelRename();
              }}
              onBlur={handleConfirmRename}
              className="flex-1 bg-transparent border-b border-primary text-sm text-gray-800 dark:text-gray-200 outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
              {listName}
            </span>
          )}
        </div>

        {/* Ellipsis button */}
        {(hoveredList === listName || menuOpenList === listName) && renamingList !== listName && (
          <button
            onClick={(e) => toggleMenu(e, listName)}
            className="p-0.5"
          >
            <MoreHorizontal size={14} className="text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-200" />
          </button>
        )}
      </button>

      {/* Dropdown menu */}
      {menuOpenList === listName && (
        <div
          ref={menuRef}
          className="absolute right-2 top-full z-50 bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-lg py-1 min-w-[140px]"
        >
          <button
            onClick={() => handleFavorite(listName)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Star size={12} className={favorites.has(listName) ? "text-yellow-500 fill-yellow-500" : ""}/>
            {favorites.has(listName) ? "Unfavorite" : "Favorite"}
          </button>
          <button
            onClick={() => handleStartRename(listName)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Pencil size={12}/>
            Rename
          </button>
          <button
            onClick={() => handleDeleteList(listName)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <Trash2 size={12}/>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}