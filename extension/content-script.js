// ===== CT Market Auto Publisher — Content Script =====
// Runs inside a Facebook group page and posts the prepared listing by PASTING
// the ready text (which already contains the property link), waiting for
// Facebook to render the link-preview card, then posting — and only reporting
// success once the composer actually closes (a real confirmation, not a guess).
//
// v3.0 — paste-based (no human-style typing), link-preview aware, verified
//        success. No photo upload: we rely on Facebook's link-preview image
//        generated from the property link in the text ("option A").

const PROPERTY_DOMAIN = 'ctmarketproperties.com';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'publishPost') {
    publishToGroup(msg.text)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep the message channel open for the async response
  }
});

async function publishToGroup(text) {
  log('Starting publish flow…');
  if (!text || !text.trim()) throw new Error('No text to publish');

  // 1) Wait for the group feed + composer trigger to actually render. Facebook
  //    lazy-loads (especially in a background tab), so we poll instead of a
  //    fixed sleep.
  const composerTrigger = await waitFor(() => findComposerTrigger(), 25000);
  if (!composerTrigger) throw new Error('Composer trigger not found');
  composerTrigger.click();

  // 2) Wait for the editable textbox to open (dialog or inline composer).
  const textbox = await waitForElement(
    '[role="dialog"] [role="textbox"][contenteditable="true"], [role="textbox"][contenteditable="true"]',
    12000
  );
  if (!textbox) throw new Error('Composer textbox did not open');
  textbox.focus();
  await sleep(500);

  // 3) PASTE the whole text in one shot (line by line to preserve paragraphs).
  const inserted = await insertText(textbox, text);
  if (!inserted) throw new Error('Could not insert the post text');

  // 4) If the text carries the property link, wait for Facebook to render its
  //    preview card. This both gives the listing photo and is our "the link was
  //    accepted" signal. We never block on it forever — proceed after a timeout.
  if (text.includes(PROPERTY_DOMAIN)) {
    const previewed = await waitForLinkPreview(12000);
    log(previewed ? 'Link preview loaded' : 'Link preview not detected (continuing anyway)');
    await sleep(1500); // let the card settle
  } else {
    await sleep(1500);
  }

  // 5) Click Post.
  const clicked = await clickPostButton();
  if (!clicked) throw new Error('Post button not found or not clickable');

  // 6) VERIFY: the composer must actually close. If it stays open the post did
  //    NOT go through (Facebook blocked it / wrong button) — report a real
  //    failure instead of a false "published".
  const closed = await waitForComposerToClose(textbox, 15000);
  if (!closed) throw new Error('Post not confirmed — composer stayed open');

  log('✅ Post confirmed (composer closed)');
  return { success: true };
}

// ============================================
// Text insertion (paste, not type)
// ============================================

async function insertText(element, text) {
  element.focus();
  await sleep(200);

  // Clear anything already in the box.
  try {
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
  } catch (_) {}
  await sleep(100);

  // Primary: insert line by line. execCommand('insertText') drops the whole
  // string at the caret and fires the input events Facebook's editor listens
  // for; insertLineBreak keeps paragraph breaks without submitting the post.
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) { insertNewline(element); await sleep(30); }
    if (lines[i].length) { document.execCommand('insertText', false, lines[i]); await sleep(30); }
  }
  await sleep(400);
  if (textLanded(element, text)) return true;

  // Fallback: a single synthetic paste carrying the text via DataTransfer.
  try {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  } catch (_) {}
  await sleep(400);
  if (textLanded(element, text)) return true;

  // Last resort: real clipboard + execCommand paste (may be blocked; best effort).
  try {
    await navigator.clipboard.writeText(text);
    document.execCommand('paste');
  } catch (_) {}
  await sleep(400);
  return textLanded(element, text);
}

function insertNewline(element) {
  try {
    if (!document.execCommand('insertLineBreak')) document.execCommand('insertParagraph');
  } catch (_) {}
}

// True only when most of the text (and the link, if present) actually landed in
// the box — so we never click Post on an empty or half-filled composer.
function textLanded(element, text) {
  const content = (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
  const want = text.replace(/\s+/g, ' ').trim();
  if (!want) return true;
  if (want.includes(PROPERTY_DOMAIN) && !content.includes(PROPERTY_DOMAIN)) return false;
  const head = want.slice(0, 20);
  return content.includes(head) && content.length >= Math.floor(want.length * 0.7);
}

// ============================================
// Link preview
// ============================================

async function waitForLinkPreview(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const scope = document.querySelector('[role="dialog"], [aria-modal="true"]') || document.body;
    // A rendered anchor to our domain inside the composer is a definite signal.
    if (scope.querySelector(`a[href*="${PROPERTY_DOMAIN}"]`)) return true;
    // Otherwise: the domain text shows up twice (once in the typed URL, once in
    // the rendered preview card).
    const txt = scope.innerText || '';
    const hits = (txt.match(/ctmarketproperties\.com/gi) || []).length;
    if (hits >= 2) return true;
    await sleep(500);
  }
  return false;
}

// ============================================
// Composer trigger — 5 strategies
// ============================================

function findComposerTrigger() {
  // Strategy 1: aria-label
  const ariaLabels = [
    'Create a public post…', 'Create a public post', 'Create a post',
    'Write something…', 'Write something',
    'כתבו משהו…', 'כתבו משהו', 'יצירת פוסט',
    "What's on your mind", 'מה חדש', 'מה על דעתך',
  ];
  for (const label of ariaLabels) {
    const el = document.querySelector(`[aria-label="${label}"]`);
    if (el) { log(`Composer via aria-label: "${label}"`); return el; }
  }

  // Strategy 2: role="button" with matching text
  const triggerTexts = [
    'כתבו משהו', 'Write something', 'מה חדש',
    "What's on your mind", 'יצירת פוסט', 'Create a post', 'מה על דעתך',
  ];
  const buttons = document.querySelectorAll('[role="button"]');
  for (const btn of buttons) {
    const btnText = btn.textContent || btn.innerText || '';
    if (triggerTexts.some(t => btnText.includes(t))) { log('Composer via button text'); return btn; }
  }

  // Strategy 3: placeholder spans
  const placeholderEls = document.querySelectorAll('span[data-text="true"], span[style*="user-select"]');
  for (const el of placeholderEls) {
    const txt = el.textContent || '';
    if (triggerTexts.some(t => txt.includes(t))) {
      const clickable = el.closest('[role="button"]') || el.closest('[tabindex="0"]') || el.parentElement;
      if (clickable) { log('Composer via placeholder span'); return clickable; }
    }
  }

  // Strategy 4: form structure
  for (const form of document.querySelectorAll('form[method="POST"]')) {
    const trigger = form.querySelector('[role="button"][tabindex="0"]');
    if (trigger) { log('Composer via form structure'); return trigger; }
  }

  // Strategy 5: size heuristic (last resort)
  for (const el of document.querySelectorAll('[tabindex="0"][role="button"]')) {
    const rect = el.getBoundingClientRect();
    if (rect.height >= 30 && rect.height <= 70 && rect.width >= 200 && rect.top > 100 && rect.top < 600) {
      const text = el.textContent || '';
      if (!/like|share|comment|אהבתי|שיתוף|תגובה/i.test(text)) { log('Composer via size heuristic'); return el; }
    }
  }

  return null;
}

// ============================================
// Post button — prefer "Post", fall back to "Share"
// ============================================

async function clickPostButton() {
  const primary = ['פרסום', 'פרסם', 'פרסמי', 'Post', 'Publish'];
  const fallback = ['שיתוף', 'Share'];

  const findIn = (root, labels) => {
    for (const btn of root.querySelectorAll('[role="button"], [aria-label]')) {
      if (btn.getAttribute('aria-disabled') === 'true') continue;
      if (btn.offsetParent === null) continue;
      const label = (btn.getAttribute('aria-label') || '').trim();
      const text = (btn.textContent || '').trim();
      if (labels.some(l => label === l || text === l)) return btn;
    }
    return null;
  };

  const dialogs = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
  for (const d of dialogs) { const b = findIn(d, primary); if (b) { log('Post button (dialog/primary)'); b.click(); return true; } }
  for (const d of dialogs) { const b = findIn(d, fallback); if (b) { log('Post button (dialog/share)'); b.click(); return true; } }
  const any = findIn(document, primary); if (any) { log('Post button (global/primary)'); any.click(); return true; }
  return false;
}

// ============================================
// Success verification
// ============================================

async function waitForComposerToClose(textbox, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const gone = !document.contains(textbox) || textbox.offsetParent === null;
    const stillOpen = document.querySelector('[role="dialog"] [role="textbox"][contenteditable="true"]');
    if (gone && !stillOpen) return true;
    await sleep(500);
  }
  return false;
}

// ============================================
// Helpers
// ============================================

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(...args) { console.log('[CT Publisher]', ...args); }

async function waitFor(fn, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const v = fn(); if (v) return v; } catch (_) {}
    await sleep(500);
  }
  return null;
}

async function waitForElement(selector, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) return el;
    await sleep(500);
  }
  return null;
}
