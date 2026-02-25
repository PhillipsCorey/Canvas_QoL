export default function ListDetailsPanel({ listName }) {


  /////////////
  // Render //
  ////////////
  return (
    <div className="flex flex-1 h-screen flex-col bg-light-bg dark:bg-dark-bg">

      {/* Header */}
      <div className="flex flex-col flex-1 items-center justify-center gap-3 px-6 py-4">
        <h2 className="mt-16 text-3xl font-bold text-primary">{listName}</h2>
        <div className="flex h-full w-full justify-center items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            List detail view coming soon...
          </span>
        </div>
      </div>
    </div>
  );
}