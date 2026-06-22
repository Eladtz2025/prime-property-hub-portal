// ===== CT Market Auto Publisher — Background Service Worker =====

const SUPABASE_URL = 'https://jswumsdymlooeobrxict.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzd3Vtc2R5bWxvb2VvYnJ4aWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTIyNDQsImV4cCI6MjA3MjMyODI0NH0.EyxwF2qYl0u3BaVApI8wFaVYeLYJec-2vFcGeYPe9mM';
const FUNC_URL = `${SUPABASE_URL}/functions/v1/group-publish-queue`;

const CHECK_INTERVAL_MINUTES = 2;
const POST_DELAY = { min: 60000, max: 120000 }; // 60-120s cool-down between posts
const LEASE_KEY = 'processingLease';
const LEASE_MS = 6 * 60 * 1000; // one post must finish within 6 min, else the lease auto-expires

// ─── Alarm setup — also (re)created on install/startup so it survives the
//     MV3 service worker being suspended. ───
function ensureAlarm() {
  chrome.alarms.create('checkQueue', { periodInMinutes: CHECK_INTERVAL_MINUTES });
}
ensureAlarm();
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkQueue') return;
  const { paused } = await chrome.storage.local.get('paused');
  if (paused) return;
  await processNextPost();
});

// ─── Processing lease ───
// A persistent lock in storage. The MV3 worker can be killed mid-post (a single
// post runs for 1-3 min); without this, the next 2-min alarm would wake a fresh
// worker with the in-memory flag reset and start a SECOND overlapping run —
// double-posting, which is exactly what Facebook bans accounts for. The lease
// survives worker sleep and auto-expires if a run dies, so the queue never stalls
// forever either.
async function acquireLease() {
  const { [LEASE_KEY]: until = 0 } = await chrome.storage.local.get(LEASE_KEY);
  if (until && Date.now() < until) return false; // a run is already in progress
  await chrome.storage.local.set({ [LEASE_KEY]: Date.now() + LEASE_MS });
  return true;
}
async function releaseLease() {
  await chrome.storage.local.set({ [LEASE_KEY]: 0 });
}

// ─── Main processing loop ───
async function processNextPost() {
  if (!(await acquireLease())) return; // someone else holds the lease

  try {
    // 1. Fetch next post from the queue
    const res = await fetch(`${FUNC_URL}?action=next`, {
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    const data = await res.json();
    if (!data || !data.id) return;

    await addLog(`🔄 פותח קבוצה: ${data.group_name}`);

    // 2. Open the group on the canonical desktop site (our selectors target it).
    const groupUrl = normalizeFacebookUrl(data.group_url);
    const tab = await chrome.tabs.create({ url: groupUrl, active: false });

    try {
      // 3. Wait for the tab, then hand the prepared text to the content script.
      //    No images: we rely on Facebook's link-preview image (option A), so we
      //    only pass the text (which already contains the property link).
      await waitForTabLoad(tab.id);
      await sleep(3000);

      const result = await chrome.tabs.sendMessage(tab.id, {
        action: 'publishPost',
        text: data.content_text,
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
    } finally {
      // 4. Close the tab no matter what.
      try { await chrome.tabs.remove(tab.id); } catch (_) {}
    }

    // 5. Cool-down before the next post — kept INSIDE the lease so the 2-min
    //    alarm can't start an overlapping run during the gap.
    const delay = POST_DELAY.min + Math.random() * (POST_DELAY.max - POST_DELAY.min);
    await sleep(delay);
  } catch (err) {
    await addLog(`⚠️ שגיאת מערכת: ${err.message}`);
  } finally {
    await releaseLease();
  }
}

function normalizeFacebookUrl(url) {
  try {
    return String(url)
      .replace('://m.facebook.com', '://www.facebook.com')
      .replace('://web.facebook.com', '://www.facebook.com');
  } catch (_) { return url; }
}

// ─── API helpers ───
async function reportComplete(id) {
  await fetch(`${FUNC_URL}?action=complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

async function reportFail(id, error) {
  await fetch(`${FUNC_URL}?action=fail`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
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
    // Resolve anyway after 30s — the content script polls for the composer, so a
    // slightly-early start is fine.
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Logging / stats ───
async function addLog(message) {
  const { logs = [] } = await chrome.storage.local.get('logs');
  logs.unshift({ time: new Date().toISOString(), message });
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
    // processNextPost() no-ops while the lease is held, so a manual click can't
    // start a second overlapping run.
    chrome.storage.local.get('paused', ({ paused }) => { if (!paused) processNextPost(); });
    sendResponse({ ok: true });
  }
});

async function getStats() {
  const today = new Date().toISOString().slice(0, 10);
  const { stats = {}, logs = [], paused = false } = await chrome.storage.local.get(['stats', 'logs', 'paused']);
  const todayStats = stats[today] || { published: 0, failed: 0 };

  // Also fetch queue stats from the server.
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
