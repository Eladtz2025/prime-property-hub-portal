// ===== CT Market Auto Publisher — Content Script =====
// Runs inside Facebook group pages to automate posting

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'publishPost') {
    publishToGroup(msg.text, msg.images)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});

async function publishToGroup(text, imageUrls) {
  // 1. Find and click the composer trigger ("Write something" / "כתבו משהו")
  const composerTrigger = await waitForElement(
    '[role="button"]',
    'כתבו משהו', 'Write something', 'מה חדש', "What's on your mind"
  );

  if (!composerTrigger) {
    throw new Error('Composer trigger not found');
  }

  composerTrigger.click();
  await sleep(2500);

  // 2. Find the text editor
  const textbox = await waitForElement('[role="textbox"][contenteditable="true"]');
  if (!textbox) {
    throw new Error('Textbox not found after opening composer');
  }

  // 3. Focus and type text with human-like speed
  textbox.focus();
  await sleep(500);
  await humanType(textbox, text);
  await sleep(1000);

  // 4. Upload images if provided
  if (imageUrls && imageUrls.length > 0) {
    await uploadImages(imageUrls);
  }

  // 5. Wait for everything to settle
  await sleep(3000);

  // 6. Click the Post button
  const postBtn = await findPostButton();
  if (!postBtn) {
    throw new Error('Post button not found');
  }

  postBtn.click();
  await sleep(4000);

  return { success: true };
}

// ─── Human-like typing ───
async function humanType(element, text) {
  element.focus();

  // Clear any existing text
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);

  for (const char of text) {
    // Use insertText which triggers React/Facebook's input handlers
    document.execCommand('insertText', false, char);
    // Random delay 30-80ms per character
    await sleep(30 + Math.random() * 50);
  }
}

// ─── Image upload ───
async function uploadImages(imageUrls) {
  // Look for the Photo/Video button in the composer
  const photoBtn = await waitForElement(
    '[aria-label*="Photo"], [aria-label*="photo"], [aria-label*="תמונה"], [aria-label*="סרטון"]'
  );

  if (!photoBtn) {
    console.log('Photo button not found — skipping images');
    return;
  }

  photoBtn.click();
  await sleep(1500);

  // Find file input
  const fileInput = document.querySelector('input[type="file"][accept*="image"]');
  if (!fileInput) {
    console.log('File input not found — skipping images');
    return;
  }

  // Download images and create file objects
  const files = [];
  for (const url of imageUrls) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'image.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      files.push(file);
    } catch (err) {
      console.error('Failed to download image:', url, err);
    }
  }

  if (files.length > 0) {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    // Wait for upload processing
    await sleep(2000 * files.length);
  }
}

// ─── Find Post button ───
async function findPostButton() {
  // Try multiple selectors Facebook uses
  const selectors = [
    '[aria-label="Post"]',
    '[aria-label="פרסום"]',
    '[aria-label="Publish"]',
    '[aria-label="פרסם"]',
    'div[role="dialog"] form [type="submit"]',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && !el.disabled) return el;
  }

  // Fallback: look for a button with "Post" / "פרסום" text inside the dialog
  const dialog = document.querySelector('[role="dialog"]');
  if (dialog) {
    const buttons = dialog.querySelectorAll('[role="button"]');
    for (const btn of buttons) {
      const txt = btn.textContent?.trim();
      if (txt === 'Post' || txt === 'פרסום' || txt === 'פרסם' || txt === 'Publish') {
        return btn;
      }
    }
  }

  return null;
}

// ─── Helpers ───
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForElement(selector, ...textOptions) {
  for (let i = 0; i < 30; i++) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      if (textOptions.length === 0) return el;
      const elText = el.textContent || '';
      if (textOptions.some(t => elText.includes(t))) return el;
    }
    await sleep(500);
  }
  return null;
}
