import { useState } from "react";

export default function FirstTimeSetup({ onComplete }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    setEnabled(true);
    setTimeout(() => onComplete(), 300);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">Enable tasque</p>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}