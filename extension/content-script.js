// ===== CT Market Auto Publisher — Content Script =====
// Runs inside Facebook group pages to automate posting
// v2.0 — Multi-strategy selectors for Facebook DOM resilience

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'publishPost') {
    publishToGroup(msg.text, msg.images)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});

async function publishToGroup(text, imageUrls) {
  console.log('[CT Publisher] Starting publish flow...');
  
  // Wait for page to fully load
  await sleep(3000);

  // === Step 1: Find and click the composer trigger ===
  console.log('[CT Publisher] Step 1: Looking for composer trigger...');
  const composerTrigger = await findComposerTrigger();
  if (!composerTrigger) {
    throw new Error('Composer trigger not found');
  }

  composerTrigger.click();
  await sleep(2500);

  // === Step 2: Find the textbox inside the modal ===
  console.log('[CT Publisher] Step 2: Looking for textbox...');
  const textbox = await waitForElement(
    '[role="textbox"][contenteditable="true"]',
    15000
  );
  if (!textbox) {
    throw new Error('Textbox not found in composer dialog');
  }

  // === Step 3: Human-like typing ===
  console.log('[CT Publisher] Step 3: Typing text...');
  textbox.focus();
  await sleep(500);

  // Method 1: insertText
  const typed = await humanType(textbox, text);
  if (!typed) {
    // Method 2: clipboard fallback
    console.log('[CT Publisher] insertText failed, trying clipboard paste...');
    await clipboardPaste(textbox, text);
  }

  await sleep(1500);

  // === Step 4: Upload images (optional) ===
  if (imageUrls && imageUrls.length > 0) {
    console.log('[CT Publisher] Step 4: Uploading', imageUrls.length, 'images...');
    await addImages(imageUrls);
  }

  // === Step 5: Click "Post" button ===
  console.log('[CT Publisher] Step 5: Clicking Post button...');
  await sleep(2000);
  const posted = await clickPostButton();
  if (!posted) {
    throw new Error('Post button not found or not clickable');
  }

  // Wait for confirmation
  await sleep(4000);
  console.log('[CT Publisher] ✅ Post published successfully!');
  return { success: true };
}

// ============================================
// Composer Trigger — 5 strategies
// ============================================

async function findComposerTrigger() {
  // Strategy 1: aria-label
  const ariaLabels = [
    'Create a public post…',
    'Create a public post',
    'Create a post',
    'Write something…',
    'Write something',
    'כתבו משהו…',
    'כתבו משהו',
    'יצירת פוסט',
    'What\'s on your mind',
    'מה חדש',
    'מה על דעתך',
  ];

  for (const label of ariaLabels) {
    const el = document.querySelector(`[aria-label="${label}"]`);
    if (el) {
      console.log(`[CT Publisher] Found composer via aria-label: "${label}"`);
      return el;
    }
  }

  // Strategy 2: role="button" with matching text
  const triggerTexts = [
    'כתבו משהו', 'Write something', 'מה חדש',
    'What\'s on your mind', 'יצירת פוסט', 'Create a post',
    'מה על דעתך',
  ];

  const buttons = document.querySelectorAll('[role="button"]');
  for (const btn of buttons) {
    const btnText = btn.textContent || btn.innerText || '';
    for (const trigger of triggerTexts) {
      if (btnText.includes(trigger)) {
        console.log(`[CT Publisher] Found composer via button text: "${trigger}"`);
        return btn;
      }
    }
  }

  // Strategy 3: placeholder spans
  const placeholderEls = document.querySelectorAll(
    'span[data-text="true"], span[style*="user-select"]'
  );
  for (const el of placeholderEls) {
    const txt = el.textContent || '';
    if (triggerTexts.some(t => txt.includes(t))) {
      const clickable = el.closest('[role="button"]')
        || el.closest('[tabindex="0"]')
        || el.parentElement;
      if (clickable) {
        console.log('[CT Publisher] Found composer via placeholder span');
        return clickable;
      }
    }
  }

  // Strategy 4: form structure
  const forms = document.querySelectorAll('form[method="POST"]');
  for (const form of forms) {
    const trigger = form.querySelector('[role="button"][tabindex="0"]');
    if (trigger) {
      console.log('[CT Publisher] Found composer via form structure');
      return trigger;
    }
  }

  // Strategy 5: size heuristic (last resort)
  const allClickables = document.querySelectorAll(
    '[tabindex="0"][role="button"]'
  );
  for (const el of allClickables) {
    const rect = el.getBoundingClientRect();
    if (rect.height >= 30 && rect.height <= 70 &&
        rect.width >= 200 && rect.top > 100 && rect.top < 600) {
      const text = el.textContent || '';
      if (!/like|share|comment|אהבתי|שיתוף|תגובה/i.test(text)) {
        console.log('[CT Publisher] Found composer via size heuristic');
        return el;
      }
    }
  }

  return null;
}

// ============================================
// Post Button — 3 strategies
// ============================================

async function clickPostButton() {
  const postLabels = [
    'Post', 'פרסום', 'פרסמו', 'פרסם', 'Publish', 'Share', 'שיתוף'
  ];

  // Strategy 1: aria-label
  for (const label of postLabels) {
    const btn = document.querySelector(
      `[aria-label="${label}"][role="button"]`
    );
    if (btn && !btn.disabled && btn.offsetParent !== null) {
      console.log(`[CT Publisher] Clicking post button via aria-label: "${label}"`);
      btn.click();
      return true;
    }
  }

  // Strategy 2: search inside dialog/modal
  const dialogs = document.querySelectorAll(
    '[role="dialog"], [aria-modal="true"]'
  );
  for (const dialog of dialogs) {
    const buttons = dialog.querySelectorAll('[role="button"]');
    for (const btn of buttons) {
      const text = (btn.textContent || '').trim();
      if (postLabels.some(l => text === l || text.includes(l))) {
        const style = window.getComputedStyle(btn);
        if (style.opacity !== '0.3' && style.pointerEvents !== 'none') {
          console.log(`[CT Publisher] Clicking post button in dialog: "${text}"`);
          btn.click();
          return true;
        }
      }
    }
  }

  // Strategy 3: blue submit button
  const allButtons = document.querySelectorAll('[role="button"]');
  for (const btn of allButtons) {
    const text = (btn.textContent || '').trim();
    if (postLabels.some(l => text === l)) {
      const bg = window.getComputedStyle(btn).backgroundColor;
      if (bg.includes('24, 119, 242') || bg.includes('0, 100, 224')) {
        console.log(`[CT Publisher] Clicking blue post button: "${text}"`);
        btn.click();
        return true;
      }
    }
  }

  return false;
}

// ============================================
// Typing helpers
// ============================================

async function humanType(element, text) {
  try {
    element.focus();
    await sleep(300);

    // Clear existing text
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    await sleep(100);

    // Type character by character
    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '\n') {
        element.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
        }));
        element.dispatchEvent(new KeyboardEvent('keyup', {
          key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
        }));
      } else {
        document.execCommand('insertText', false, char);
      }

      // Human-like delay
      let delay = 20 + Math.random() * 40;
      if (char === '.' || char === '\n') delay += 200 + Math.random() * 300;
      if (char === ' ') delay = 10 + Math.random() * 20;
      await sleep(delay);
    }

    // Verify text was entered
    await sleep(500);
    const content = element.textContent || element.innerText || '';
    if (content.length < text.length * 0.5) {
      console.warn('[CT Publisher] humanType: less than 50% of text was typed');
      return false;
    }
    console.log('[CT Publisher] humanType: text entered successfully');
    return true;
  } catch (e) {
    console.error('[CT Publisher] humanType failed:', e);
    return false;
  }
}

async function clipboardPaste(element, text) {
  try {
    element.focus();
    await sleep(300);

    // Try using InputEvent directly (most reliable fallback)
    const inputEvent = new InputEvent('beforeinput', {
      inputType: 'insertText',
      data: text,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(inputEvent);
    await sleep(300);

    // Check if it worked
    const content = element.textContent || element.innerText || '';
    if (content.includes(text.substring(0, 20))) {
      console.log('[CT Publisher] clipboardPaste: InputEvent method worked');
      return;
    }

    // Try clipboard API as last resort
    try {
      await navigator.clipboard.writeText(text);
      const pasteEvent = new InputEvent('beforeinput', {
        inputType: 'insertFromPaste',
        data: text,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(pasteEvent);
      console.log('[CT Publisher] clipboardPaste: clipboard API method attempted');
    } catch (clipErr) {
      console.error('[CT Publisher] clipboard API unavailable:', clipErr);
    }
  } catch (e) {
    console.error('[CT Publisher] clipboardPaste failed:', e);
  }
}

// ============================================
// Image upload
// ============================================

async function addImages(imageUrls) {
  const photoLabels = [
    'Photo/video', 'Photo/Video', 'תמונה/סרטון',
    'תמונה', 'Photo', 'Add Photos', 'הוספת תמונות'
  ];

  let photoBtn = null;
  const dialogs = document.querySelectorAll(
    '[role="dialog"], [aria-modal="true"]'
  );

  for (const dialog of dialogs) {
    const buttons = dialog.querySelectorAll('[role="button"], [aria-label]');
    for (const btn of buttons) {
      const label = btn.getAttribute('aria-label') || '';
      const text = btn.textContent || '';
      if (photoLabels.some(l => label.includes(l) || text.includes(l))) {
        photoBtn = btn;
        break;
      }
    }
    if (photoBtn) break;
  }

  if (!photoBtn) {
    console.warn('[CT Publisher] Photo button not found, skipping images');
    return;
  }

  photoBtn.click();
  await sleep(2000);

  const fileInput = document.querySelector(
    'input[type="file"][accept*="image"]'
  );
  if (!fileInput) {
    console.warn('[CT Publisher] File input not found');
    return;
  }

  for (const url of imageUrls) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File(
        [blob],
        'property.jpg',
        { type: blob.type || 'image/jpeg' }
      );

      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      await sleep(2000);
      console.log('[CT Publisher] Image uploaded:', url.substring(0, 50) + '...');
    } catch (e) {
      console.error('[CT Publisher] Failed to upload image:', url, e);
    }
  }
}

// ============================================
// Helpers
// ============================================

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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
