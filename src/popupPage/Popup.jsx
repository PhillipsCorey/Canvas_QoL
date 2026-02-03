export default function Popup() {
  const openChat = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("chat.html")
    });
  };

  return (
    <div className="w-64 p-4 bg-slate-900 text-white">
      <h1 className="text-lg font-bold mb-3">
        Tailwind Works ✅
      </h1>

      <button
        onClick={openChat}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
      >
        Open Chat
      </button>
    </div>
  );
}
