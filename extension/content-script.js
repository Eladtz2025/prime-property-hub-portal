// ===== CT Market Auto Publisher — Content Script =====
// Runs inside a Facebook group page and posts the prepared listing by PASTING
// the ready text (which already contains the property link) into the "Create
// post" dialog, waiting for Facebook to render the link-preview card, then
// posting — and only reporting success once the dialog actually closes.
//
// v3.1 — targets the composer MODAL specifically (the dialog that has both an
//        editable textbox AND a Post button) so we never type into a feed
//        comment box by mistake, and we poll for Post to become enabled. No
//        photo upload: we rely on Facebook's link-preview image ("option A").

const PROPERTY_DOMAIN = 'ctmarketproperties.com';
const POST_LABELS = ['פרסום', 'פרסם', 'פרסמי', 'Post', 'Publish', 'שיתוף', 'Share'];

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

  // Separate the property link from the body. Facebook needs the link IN the
  // composer to build the rich preview card (photo + title + price), but we do
  // NOT want the raw URL cluttering the final post (it also wrecks RTL layout).
  // So: paste the link first to trigger the card, then replace the text with the
  // clean body — Facebook keeps the card attached once it has loaded.
  const linkMatch = text.match(/https?:\/\/\S*ctmarketproperties\.com\/\S+/i);
  const link = linkMatch ? linkMatch[0] : null;
  const cleanText = (link
    ? text.replace(link, '').replace(/🔗/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    : text).trim();

  // 1) Open the composer.
  const composerTrigger = await waitFor(() => findComposerTrigger(), 25000);
  if (!composerTrigger) throw new Error('Composer trigger not found');
  composerTrigger.click();

  // 2) Find the composer MODAL — the visible dialog that has BOTH an editable
  //    textbox and a Post button (distinguishes it from Messenger and the inline
  //    "Comment as …" boxes in the feed).
  const modal = await waitFor(() => findComposerModal(), 12000);
  let scope, textbox;
  if (modal) {
    scope = modal;
    textbox = modal.querySelector('[role="textbox"][contenteditable="true"]');
  } else {
    textbox = await waitFor(() => [...document.querySelectorAll('[role="textbox"][contenteditable="true"]')]
      .find(t => t.offsetParent !== null && !/comment|תגוב/i.test(t.getAttribute('aria-label') || '')), 4000);
    scope = document;
  }
  if (!textbox) throw new Error('Composer textbox did not open');
  textbox.focus();
  await sleep(500);

  // 3) Build the post: link-first for the card, then the clean body.
  if (link) {
    if (!await insertText(textbox, link)) throw new Error('Could not insert the link');
    const previewed = await waitForLinkPreview(scope, 15000);
    log(previewed ? 'Link preview loaded' : 'Link preview not detected');
    await sleep(1800); // let the card finish attaching before we swap the text
    if (!await insertText(textbox, cleanText)) throw new Error('Could not insert the post text');
    await sleep(1000);
  } else {
    if (!await insertText(textbox, cleanText)) throw new Error('Could not insert the post text');
    await sleep(1500);
  }

  // 4) Click Post (inside the modal; poll until it is enabled).
  const clicked = await clickPostButton(scope);
  if (!clicked) throw new Error('Post button not found or not clickable');

  // 5) VERIFY: the composer must actually close. Facebook only closes the dialog
  //    on a SUCCESSFUL submit, so this is a real confirmation. A fresh OG scrape
  //    (cache-busted link) makes a big group slow to submit — observed 45s+ — so
  //    wait generously: a too-short timeout would falsely report failure and
  //    trigger a retry → double post.
  const closed = await waitForComposerClosed(modal, textbox, 90000);
  if (!closed) throw new Error('Post not confirmed — composer stayed open');

  log('✅ Post confirmed (composer closed)');
  return { success: true };
}

// ============================================
// Composer modal
// ============================================

// The "Create post" dialog is the visible [role=dialog] that contains BOTH an
// editable textbox and a Post button. Picking it this way avoids the feed's
// comment boxes and the Messenger panel.
function findComposerModal() {
  for (const d of document.querySelectorAll('[role="dialog"], [aria-modal="true"]')) {
    if (d.offsetParent === null) continue;
    const tb = d.querySelector('[role="textbox"][contenteditable="true"]');
    if (!tb) continue;
    const hasPost = [...d.querySelectorAll('[role="button"], [aria-label]')].some(b => {
      const t = (b.textContent || '').trim();
      const a = (b.getAttribute('aria-label') || '').trim();
      return POST_LABELS.includes(t) || POST_LABELS.includes(a);
    });
    if (hasPost) return d;
  }
  return null;
}

// ============================================
// Text insertion (paste, not type)
// ============================================

async function insertText(element, text) {
  element.focus();
  await sleep(200);

  try {
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
  } catch (_) {}
  await sleep(100);

  // Primary: insert line by line. execCommand('insertText') drops the whole
  // string at the caret and fires the input events Facebook's editor listens for.
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

// True only when most of the text (and the link, if present) actually landed.
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

async function waitForLinkPreview(root, timeoutMs) {
  const scope = root || document.body;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (scope.querySelector(`a[href*="${PROPERTY_DOMAIN}"]`)) return true;
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

  const triggerTexts = [
    'כתבו משהו', 'Write something', 'מה חדש',
    "What's on your mind", 'יצירת פוסט', 'Create a post', 'מה על דעתך',
  ];
  for (const btn of document.querySelectorAll('[role="button"]')) {
    const btnText = btn.textContent || btn.innerText || '';
    if (triggerTexts.some(t => btnText.includes(t))) { log('Composer via button text'); return btn; }
  }

  for (const el of document.querySelectorAll('span[data-text="true"], span[style*="user-select"]')) {
    const txt = el.textContent || '';
    if (triggerTexts.some(t => txt.includes(t))) {
      const clickable = el.closest('[role="button"]') || el.closest('[tabindex="0"]') || el.parentElement;
      if (clickable) { log('Composer via placeholder span'); return clickable; }
    }
  }

  for (const form of document.querySelectorAll('form[method="POST"]')) {
    const trigger = form.querySelector('[role="button"][tabindex="0"]');
    if (trigger) { log('Composer via form structure'); return trigger; }
  }

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
// Post button — prefer "Post", fall back to "Share"; poll until enabled
// ============================================

async function clickPostButton(root) {
  const scope = root || document;
  const primary = ['פרסום', 'פרסם', 'פרסמי', 'Post', 'Publish'];
  const fallback = ['שיתוף', 'Share'];

  const findEnabled = (labels) => {
    for (const btn of scope.querySelectorAll('[role="button"], [aria-label]')) {
      if (btn.getAttribute('aria-disabled') === 'true') continue;
      if (btn.offsetParent === null) continue;
      const label = (btn.getAttribute('aria-label') || '').trim();
      const text = (btn.textContent || '').trim();
      if (labels.some(l => label === l || text === l)) return btn;
    }
    return null;
  };

  // Facebook enables Post a beat after the text/preview lands — poll for it.
  const btn = await waitFor(() => findEnabled(primary) || findEnabled(fallback), 8000);
  if (btn) { log(`Clicking post button: "${(btn.textContent || btn.getAttribute('aria-label') || '').trim()}"`); btn.click(); return true; }
  return false;
}

// ============================================
// Success verification
// ============================================

async function waitForComposerClosed(modal, textbox, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const modalGone = !modal || !document.contains(modal) || modal.offsetParent === null;
    const boxGone = !document.contains(textbox) || textbox.offsetParent === null;
    if (modalGone && boxGone) return true;
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
