// pm-view.js — Additional PM View functionality
// Supplements the inline script in pm-view.html with attachment handling

// ═══════════════════════════════════════════════════════
// SCREENSHOT/ATTACHMENT HANDLERS
// ═══════════════════════════════════════════════════════
window.ctAttachments = [];
window.commentAttachments = [];

function initScreenshots() {
  const dropZone  = document.getElementById('ctDropZone');
  const fileInput = document.getElementById('ctFileInput');
  if (!dropZone || !fileInput) return;
  dropZone.addEventListener('click',     () => fileInput.click());
  fileInput.addEventListener('change',   e  => { addFiles(Array.from(e.target.files), 'ct'); fileInput.value=''; });
  dropZone.addEventListener('dragover',  e  => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')), 'ct');
  });
  document.getElementById('createTicketModal').addEventListener('paste', e => {
    const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
    if (imgs.length) addFiles(imgs, 'ct');
  });
  const newComment = document.getElementById('newComment');
  if (newComment) {
    newComment.addEventListener('paste', e => {
      const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
      if (imgs.length) { e.preventDefault(); addFiles(imgs, 'comment'); }
    });
  }
}

function addFiles(files, target) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      if (target === 'ct')  { window.ctAttachments.push(ev.target.result);      renderPreviews(window.ctAttachments,      'ctPreview',      'ct'); }
      else                  { window.commentAttachments.push(ev.target.result);  renderPreviews(window.commentAttachments, 'commentPreview', 'comment'); }
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(arr, cid, target) {
  const el = document.getElementById(cid);
  if (!el) return;
  el.innerHTML = arr.map((src, i) => `
    <div class="screenshot-thumb">
      <img src="${src}" onclick="window.open().document.write('<img src=${JSON.stringify(src)} style=max-width:100%>')"/>
      <div class="remove-img" onclick="removeAttachment(${i},'${target}')"><i class="bi bi-x"></i></div>
    </div>`).join('');
}

function removeAttachment(i, target) {
  if (target === 'ct')  { window.ctAttachments.splice(i,1);      renderPreviews(window.ctAttachments,      'ctPreview',      'ct'); }
  else                  { window.commentAttachments.splice(i,1);  renderPreviews(window.commentAttachments, 'commentPreview', 'comment'); }
}

// Screenshot initialization will be called after login in doLogin()
