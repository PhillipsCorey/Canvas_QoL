const STYLES = `
  #cqol-reminders {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 280px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .cqol-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    animation: cqol-slide-in 0.2s ease;
  }

  .cqol-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .cqol-category {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
  }

  .cqol-title {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cqol-time {
    font-size: 11px;
    color: #64748b;
  }

  .cqol-dismiss {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 18px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
    flex-shrink: 0;
  }

  .cqol-dismiss:hover {
    color: #475569;
  }

  @keyframes cqol-slide-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-color-scheme: dark) {
    .cqol-card {
      background: #1e1e2e;
      border-color: #3a3a4a;
    }
    .cqol-title {
      color: #f1f5f9;
    }
    .cqol-time {
      color: #94a3b8;
    }
  }
`;

function injectStyles() {
  if (document.getElementById("cqol-styles")) return;
  const style = document.createElement("style");
  style.id = "cqol-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTasksDueToday(todoData) {
  const today = getTodayStr();
  const due = [];

  const lists = todoData?.["To Do List"] || [];
  lists.forEach(category => {
    (category.items || []).forEach(item => {
      if (item.date === today && !item.done) {
        due.push({ ...item, categoryName: category.name });
      }
    });
  });

  return due;
}

function injectReminders(tasks) {
  document.getElementById("cqol-reminders")?.remove();
  if (tasks.length === 0) return;

  const container = document.createElement("div");
  container.id = "cqol-reminders";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "cqol-card";

    card.innerHTML = `
      <div class="cqol-card-body">
        <span class="cqol-category">${task.categoryName}</span>
        <span class="cqol-title">${task.name}</span>
        ${task.time ? `<span class="cqol-time">⏱ ${task.time}</span>` : ""}
      </div>
      <button class="cqol-dismiss" aria-label="Dismiss">×</button>
    `;

    card.querySelector(".cqol-dismiss").addEventListener("click", () => {
      card.remove();
      if (container.querySelectorAll(".cqol-card").length === 0) {
        container.remove();
      }
    });

    container.appendChild(card);
  });

  document.body.appendChild(container);
}

function checkReminders() {
  chrome.storage.local.get(["todoData"], (result) => {
    const tasks = getTasksDueToday(result.todoData);
    injectReminders(tasks);
  });
}

// Inject styles and run on page load
injectStyles();
checkReminders();

// Re-run when background alarm triggers it
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "checkReminders") checkReminders();
});