// ===== CT Market Auto Publisher — Background Service Worker =====

const SUPABASE_URL = 'https://jswumsdymlooeobrxict.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM';
const FUNC_URL = `${SUPABASE_URL}/functions/v1/group-publish-queue`;

const CHECK_INTERVAL_MINUTES = 2;
const POST_DELAY = { min: 60000, max: 120000 }; // 60-120 sec

// ─── State ───
let isProcessing = false;

// ─── Alarm setup ───
chrome.alarms.create('checkQueue', { periodInMinutes: CHECK_INTERVAL_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkQueue') return;

  const { paused } = await chrome.storage.local.get('paused');
  if (paused) return;
  if (isProcessing) return;

  await processNextPost();
});

// ─── Main processing loop ───
async function processNextPost() {
  isProcessing = true;

  try {
    // 1. Fetch next post from queue
    const res = await fetch(`${FUNC_URL}?action=next`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    const data = await res.json();

    if (!data || !data.id) {
      isProcessing = false;
      return;
    }

    await addLog(`🔄 פותח קבוצה: ${data.group_name}`);

    // 2. Open a tab to the group
    const tab = await chrome.tabs.create({ url: data.group_url, active: false });

    // 3. Wait for tab to load
    await waitForTabLoad(tab.id);
    await sleep(3000); // Extra wait for Facebook JS to render

    // 4. Send message to content script
    try {
      const result = await chrome.tabs.sendMessage(tab.id, {
        action: 'publishPost',
        text: data.content_text,
        images: data.image_urls || [],
      });

      if (result && result.success) {
        await reportComplete(data.id);
        await addLog(`✅ פורסם בהצלחה: ${data.group_name}`);
        await incrementStat('published');
      } else {
        const err = result?.error || 'Content script failed';
        await reportFail(data.id, err);
        await addLog(`❌ נכשל: ${data.group_name} — ${err}`);
        await incrementStat('failed');
      }
    } catch (err) {
      await reportFail(data.id, err.message || 'Message send failed');
      await addLog(`❌ שגיאה: ${data.group_name} — ${err.message}`);
      await incrementStat('failed');
    }

    // 5. Close the tab
    try { await chrome.tabs.remove(tab.id); } catch (_) {}

    // 6. Random delay before next post
    const delay = POST_DELAY.min + Math.random() * (POST_DELAY.max - POST_DELAY.min);
    await sleep(delay);

  } catch (err) {
    await addLog(`⚠️ שגיאת מערכת: ${err.message}`);
  }

  isProcessing = false;
}

// ─── API helpers ───
async function reportComplete(id) {
  await fetch(`${FUNC_URL}?action=complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
}

async function reportFail(id, error) {
  await fetch(`${FUNC_URL}?action=fail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, error }),
  });
}

// ─── Tab helpers ───
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (id, changeInfo) => {
      if (id === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    // Timeout after 30 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Logging ───
async function addLog(message) {
  const { logs = [] } = await chrome.storage.local.get('logs');
  logs.unshift({ time: new Date().toISOString(), message });
  // Keep last 50 entries
  await chrome.storage.local.set({ logs: logs.slice(0, 50) });
}

async function incrementStat(type) {
  const today = new Date().toISOString().slice(0, 10);
  const { stats = {} } = await chrome.storage.local.get('stats');
  if (!stats[today]) stats[today] = { published: 0, failed: 0 };
  stats[today][type] = (stats[today][type] || 0) + 1;
  await chrome.storage.local.set({ stats });
}

// ─── Message listener for popup commands ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getStats') {
    getStats().then(sendResponse);
    return true;
  }
  if (msg.action === 'forceCheck') {
    processNextPost();
    sendResponse({ ok: true });
  }
});

async function getStats() {
  const today = new Date().toISOString().slice(0, 10);
  const { stats = {}, logs = [], paused = false } = await chrome.storage.local.get(['stats', 'logs', 'paused']);
  const todayStats = stats[today] || { published: 0, failed: 0 };

  // Also fetch queue stats from server
  try {
    const res = await fetch(`${FUNC_URL}?action=stats`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    const queueStats = await res.json();
    return { ...todayStats, ...queueStats, logs: logs.slice(0, 20), paused };
  } catch (_) {
    return { ...todayStats, pending: '?', logs: logs.slice(0, 20), paused };
  }
}
