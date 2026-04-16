// ===== Popup Script =====

document.addEventListener('DOMContentLoaded', () => {
  loadStats();

  document.getElementById('toggleBtn').addEventListener('click', togglePause);
  document.getElementById('forceBtn').addEventListener('click', forceCheck);
});

async function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (stats) => {
    if (!stats) return;

    document.getElementById('pendingCount').textContent = stats.pending ?? '-';
    document.getElementById('publishedCount').textContent = stats.published_today ?? stats.published ?? 0;
    document.getElementById('failedCount').textContent = stats.failed_today ?? stats.failed ?? 0;

    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleBtn');

    if (stats.paused) {
      dot.classList.add('paused');
      text.textContent = '⏸️ מושהה';
      toggleBtn.textContent = '▶️ הפעל';
      toggleBtn.className = 'btn btn-primary';
    } else {
      dot.classList.remove('paused');
      text.textContent = '🟢 פעיל • בודק כל 2 דקות';
      toggleBtn.textContent = '⏸️ השהה';
      toggleBtn.className = 'btn btn-warning';
    }

    // Next scheduled
    const nextInfo = document.getElementById('nextInfo');
    if (stats.next_scheduled_at) {
      const next = new Date(stats.next_scheduled_at);
      const now = new Date();
      const diffMin = Math.max(0, Math.round((next - now) / 60000));
      nextInfo.innerHTML = `<strong>הבא בתור:</strong> ${diffMin > 0 ? `בעוד ${diffMin} דקות` : 'מוכן לפרסום'}`;
    } else {
      nextInfo.innerHTML = '<strong>אין פוסטים בתור</strong>';
    }

    // Logs
    const container = document.getElementById('logsContainer');
    container.innerHTML = '';
    if (stats.logs && stats.logs.length > 0) {
      stats.logs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        const time = new Date(log.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `<span class="log-time">${time}</span> ${log.message}`;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<div class="log-entry">אין לוגים עדיין</div>';
    }
  });
}

function togglePause() {
  chrome.storage.local.get('paused', ({ paused }) => {
    chrome.storage.local.set({ paused: !paused }, () => {
      loadStats();
    });
  });
}

function forceCheck() {
  chrome.runtime.sendMessage({ action: 'forceCheck' });
  const btn = document.getElementById('forceBtn');
  btn.textContent = '⏳ בודק...';
  setTimeout(() => {
    btn.textContent = '▶️ הפעל עכשיו';
    loadStats();
  }, 3000);
}
