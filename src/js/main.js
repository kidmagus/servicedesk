// Dynamic user (frontend-only)
let CURRENT_USER = localStorage.getItem('servicedesk_current_user') || 'Matthew Samson';

// ── SIDEBAR COLLAPSE ─────────────────────────
const SIDEBAR_STORAGE_KEY = 'servicedesk_sidebar_collapsed';

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const brandIcon = document.querySelector('.brand-icon');
  
  if (!sidebar || !toggleBtn) return;
  
  // Restore collapsed state from localStorage
  if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true') {
    sidebar.classList.add('collapsed');
  }
  
  // Toggle sidebar on button click
  toggleBtn.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem(SIDEBAR_STORAGE_KEY, isCollapsed);
  });

  // Allow clicking the SVG logo to expand sidebar if collapsed
  if (brandIcon) {
    brandIcon.addEventListener('click', function() {
      if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        localStorage.setItem(SIDEBAR_STORAGE_KEY, false);
      }
    });
  }
}

// Initialize sidebar on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}

// ─────────────────────────────────────────────
// Dashboard - Client Support Portal
// ─────────────────────────────────────────────

// ── SHARED DATA ───────────────────────────────
// LocalStorage helpers for tickets
const TICKETS_STORAGE_KEY = 'servicedesk_tickets';
function saveTicketsToStorage() {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(TICKETS));
}
function loadTicketsFromStorage() {
  const data = localStorage.getItem(TICKETS_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) { return null; }
  }
  return null;
}

// Default tickets array
const DEFAULT_TICKETS = [
  { id:'TK-001', reporter:'John Client', category:'Bug', title:'Website login page not responding',         status:'Open',        priority:'Critical', manager:'Sarah Johnson', ac:'',       created:'Jan 15, 2024', desc:'Users are unable to access the login page. The page loads but the login button becomes unresponsive after clicking.', comments:[{author:'John Client',role:'client',time:'Jan 15, 06:35 PM',text:'This is affecting all our users. Please prioritize.'},{author:'Sarah Johnson',role:'support',time:'Jan 15, 07:00 PM',text:"I've started investigating this issue. Will update you within 2 hours."}] },
  { id:'TK-002', reporter:'John Client', category:'Bug', title:'Mobile app crashes on iOS devices',          status:'In Progress', priority:'High',     manager:'Mike Torres',   ac:'orange', created:'Jan 15, 2024', desc:'The mobile application crashes upon launch on devices running iOS 17. Affects all iPhone 14 and 15 models.', comments:[{author:'Mike Torres',role:'support',time:'Jan 15, 05:00 PM',text:'Identified a memory leak in build 2.4.1. Patch incoming.'}] },
  { id:'TK-003', reporter:'Maria Santos', category:'Bug', title:'Slow page load times on product catalog',    status:'Resolved',    priority:'Medium',   manager:'Anna Lee',      ac:'purple', created:'Jan 14, 2024', desc:'Product catalog page took over 8 seconds to load. Optimized via CDN and lazy loading.', comments:[{author:'Anna Lee',role:'support',time:'Jan 14, 03:00 PM',text:'Issue resolved. Load time is now under 1.2s.'}] },
  { id:'TK-004', reporter:'John Client', category:'Bug', title:'Payment gateway integration errors',         status:'Open',        priority:'Critical', manager:'Sarah Johnson', ac:'',       created:'Jan 16, 2024', desc:'Payments via Stripe are failing with error code 402. Affects checkout for all product categories.', comments:[] },
  { id:'TK-005', reporter:'John Client', category:'Task', title:'Email notifications not sending',            status:'In Progress', priority:'High',     manager:'Mike Torres',   ac:'orange', created:'Jan 16, 2024', desc:'Transactional email service stopped delivering notifications. SMTP logs show 550 errors.', comments:[{author:'John Client',role:'client',time:'Jan 16, 09:00 AM',text:'This is blocking our onboarding flow.'}] },
  { id:'TK-006', reporter:'Maria Santos', category:'Bug', title:'Dashboard analytics showing incorrect data', status:'Open',        priority:'Medium',   manager:'Anna Lee',      ac:'purple', created:'Jan 16, 2024', desc:'Revenue and session metrics appear duplicated in the main analytics dashboard.', comments:[] },
  { id:'TK-007', reporter:'Carlos Reyes', category:'Bug', title:'Search feature returning no results',        status:'In Progress', priority:'High',     manager:'David Kim',     ac:'green',  created:'Jan 17, 2024', desc:'The site search returns 0 results for all queries despite items existing in the database.', comments:[{author:'David Kim',role:'support',time:'Jan 17, 10:00 AM',text:'Elasticsearch index appears corrupted. Re-indexing now.'}] },
  { id:'TK-008', reporter:'Maria Santos', category:'Task', title:'User profile images not uploading',          status:'Resolved',    priority:'Low',      manager:'Anna Lee',      ac:'purple', created:'Jan 12, 2024', desc:'Profile picture upload was failing due to incorrect S3 bucket permissions. Resolved.', comments:[] },
  { id:'TK-009', reporter:'John Client', category:'Bug', title:'Two-factor auth codes not delivered',        status:'Open',        priority:'Critical', manager:'Sarah Johnson', ac:'',       created:'Jan 17, 2024', desc:'SMS-based 2FA codes are not being sent. Users are locked out of their accounts.', comments:[{author:'John Client',role:'client',time:'Jan 17, 08:00 AM',text:'Multiple enterprise accounts affected. This is urgent.'}] },
  { id:'TK-010', reporter:'Carlos Reyes', category:'Task', title:'API rate limits too restrictive',            status:'Closed',      priority:'Medium',   manager:'David Kim',     ac:'green',  created:'Jan 10, 2024', desc:'Rate limits adjusted. Increased to 1000 req/min for enterprise plans.', comments:[] },
  { id:'TK-011', reporter:'Carlos Reyes', category:'Bug', title:'CSV export corrupting special characters',   status:'In Progress', priority:'Medium',   manager:'Mike Torres',   ac:'orange', created:'Jan 18, 2024', desc:'Exported CSV files show garbled text for accented characters or emojis.', comments:[] },
  { id:'TK-012', reporter:'John Client', category:'Bug', title:'Admin panel inaccessible after update',      status:'Open',        priority:'High',     manager:'Sarah Johnson', ac:'',       created:'Jan 18, 2024', desc:'Following the v3.2 deployment, admin users receive a 403 error on login.', comments:[] },
  { id:'TK-013', reporter:'Carlos Reyes', category:'Task', title:'Webhook events not firing',                  status:'Resolved',    priority:'High',     manager:'David Kim',     ac:'green',  created:'Jan 11, 2024', desc:'Webhook endpoints were not receiving events due to an incorrect URL in config. Fixed.', comments:[] },
  { id:'TK-014', reporter:'Maria Santos', category:'Task', title:'Onboarding wizard skipping steps',           status:'In Progress', priority:'Low',      manager:'Anna Lee',      ac:'purple', created:'Jan 19, 2024', desc:'New users report the wizard skips from step 2 to step 5, missing critical setup.', comments:[] },
  { id:'TK-015', reporter:'Carlos Reyes', category:'Bug', title:'Dark mode flickering on refresh',            status:'Closed',      priority:'Low',      manager:'Mike Torres',   ac:'orange', created:'Jan 9, 2024',  desc:'White flash on page load in dark mode. Fixed by persisting theme in localStorage.', comments:[] },
  { id:'TK-016', reporter:'John Client', category:'Task', title:'Subscription renewal emails missing',        status:'Open',        priority:'High',     manager:'Sarah Johnson', ac:'',       created:'Jan 19, 2024', desc:'Customers are not receiving renewal reminder emails 7 days before billing date.', comments:[] },
  { id:'TK-017', reporter:'Carlos Reyes', category:'Bug', title:'SSO login loop with SAML provider',          status:'In Progress', priority:'Critical', manager:'David Kim',     ac:'green',  created:'Jan 20, 2024', desc:'Enterprise SAML SSO users are caught in an authentication redirect loop.', comments:[{author:'David Kim',role:'support',time:'Jan 20, 11:00 AM',text:'Working with the IdP team to debug the SAML assertion.'}] },
  { id:'TK-018', reporter:'Maria Santos', category:'Task', title:'Bulk user import failing above 500 rows',    status:'Resolved',    priority:'Medium',   manager:'Anna Lee',      ac:'purple', created:'Jan 13, 2024', desc:'CSV imports over 500 rows timed out. Resolved with 200-row batch processing.', comments:[] },
  { id:'TK-019', reporter:'John Client', category:'Bug', title:'Audit log timestamps incorrect',             status:'Open',        priority:'Medium',   manager:'Mike Torres',   ac:'orange', created:'Jan 20, 2024', desc:'Audit logs recorded in UTC but displayed without timezone conversion.', comments:[] },
  { id:'TK-020', reporter:'John Client', category:'Bug', title:'Password reset link expiring instantly',     status:'In Progress', priority:'High',     manager:'Sarah Johnson', ac:'',       created:'Jan 21, 2024', desc:'Password reset links expire before users can click them.', comments:[{author:'John Client',role:'client',time:'Jan 21, 07:00 AM',text:'This is blocking our new employee accounts.'}] },
];

// Initialize TICKETS from storage or default
let TICKETS = loadTicketsFromStorage() || [];
// To clear all tickets, call clearAllTickets()

function clearAllTickets() {
  TICKETS = [];
  saveTicketsToStorage();
}

// Ensure all tickets have activity array (no-op since TICKETS is empty)

// ── SHARED CONSTANTS ──────────────────────────
const STATUS_CLASS = {
  'Open':        'primary text-white',
  'In Progress': 'warning text-dark',
  'Resolved':    'success text-white',
  'Closed':      'secondary text-white',
};

const PRIO_STYLE = {
  'Critical': 'background:#ffe4e6;color:#be123c',
  'High':     'background:#ffedd5;color:#9a3412',
  'Medium':   'background:#fef9c3;color:#78350f',
  'Low':      'background:#f0fdf4;color:#14532d',
};

const PAGE_SIZE = 8;

// ── SHARED STATE ──────────────────────────────
const commentsMap = {};
TICKETS.forEach(t => commentsMap[t.id] = [...t.comments]);

let selectedTicket = null;
let offcanvas      = null;

// ── STATE ──────────────────────────────────────
let page = 1, sortField = 'id', sortDir = 1;
let fStatus = '', fPriority = '', fSearch = '';
let ctAttachments      = [];
let commentAttachments = [];

// ── NOTIFICATIONS ──────────────────────────────
const NOTIFS_STORAGE_KEY = 'servicedesk_notifs';
function saveNotifsToStorage() {
  localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(NOTIFS));
}
function loadNotifsFromStorage() {
  const data = localStorage.getItem(NOTIFS_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) { return null; }
  }
  return null;
}
let NOTIFS = loadNotifsFromStorage() || [];
// To clear all notifications, call clearAllNotifs()

function clearAllNotifs() {
  NOTIFS = [];
  saveNotifsToStorage();
}

// ── UTILITIES ─────────────────────────────────
const initials = n => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function statusBadgeHTML(status, extra = '') {
  const sc = STATUS_CLASS[status] || 'secondary text-white';
  const [bg, txt] = sc.split(' ');
  return `<span class="badge bg-${bg} ${txt || ''} rounded-pill" style="font-size:11px" ${extra}>${status}</span>`;
}

function prioBadgeHTML(priority, extra = '') {
  return `<span class="badge rounded-pill" style="${PRIO_STYLE[priority]};font-size:11px" ${extra}>${priority}</span>`;
}

function renderPagination(page, totalFiltered, onPageChange) {
  const pages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  let btns = `<button class="page-btn" onclick="${onPageChange}(${page - 1})" ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;
  let s = Math.max(1, page - 2), e = Math.min(pages, s + 4);
  if (e - s < 4) s = Math.max(1, e - 4);
  for (let p = s; p <= e; p++)
    btns += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="${onPageChange}(${p})">${p}</button>`;
  btns += `<button class="page-btn" onclick="${onPageChange}(${page + 1})" ${page === pages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;
  return btns;
}

// ── SHARED OFFCANVAS LOGIC ────────────────────
function initOffcanvas() {
  offcanvas = new bootstrap.Offcanvas(document.getElementById('ticketOffcanvas'));
}

function openDetail(id, dataSource) {
  const source = dataSource || TICKETS;
  selectedTicket = source.find(t => t.id === id);
  if (!selectedTicket) return;
  document.getElementById('newComment').value = '';
  renderDetail();
  offcanvas.show();
}

function renderDetail() {
    // Manager and Category click-to-edit logic (script only, not in template)
    setTimeout(function() {
      // Manager
      var display = document.getElementById('managerDisplay');
      var select = document.getElementById('managerSelect');
      if (display && select) {
        display.onclick = function() {
          display.classList.add('d-none');
          select.classList.remove('d-none');
          select.value = t.manager;
          select.focus();
        };
        select.onblur = function() {
          select.classList.add('d-none');
          display.classList.remove('d-none');
        };
        select.onchange = function() {
          var newManager = select.value;
          if (newManager !== t.manager) {
            t.manager = newManager;
            if (commentsMap[t.id]) {
              t.activity = t.activity || [];
              t.activity.unshift({
                type: 'manager',
                author: CURRENT_USER,
                action: 'changed manager to',
                value: newManager,
                time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              });
            }
            // Push notification for manager change
            NOTIFS.unshift({
              id: Date.now(),
              icon: 'bi-person-check-fill',
              bg: '#e0e7ff',
              fg: '#3730a3',
              title: `Manager changed: ${t.id}`,
              body: `${CURRENT_USER} assigned ticket to ${newManager}`,
              time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              unread: true,
              ticketId: t.id
            });
            showToast({type: 'info', title: 'Manager changed', message: `${CURRENT_USER} assigned ticket to ${newManager}`});
            saveNotifsToStorage();
            renderNotifList && renderNotifList();
            saveTicketsToStorage();
            if (typeof render === 'function') render();
            renderDetail();
          } else {
            select.classList.add('d-none');
            display.classList.remove('d-none');
          }
        };
      }

      // Category
      var catDisplay = document.getElementById('categoryDisplay');
      var catSelect = document.getElementById('categorySelect');
      if (catDisplay && catSelect) {
        catDisplay.onclick = function() {
          catDisplay.classList.add('d-none');
          catSelect.classList.remove('d-none');
          catSelect.value = t.category;
          catSelect.focus();
        };
        catSelect.onblur = function() {
          catSelect.classList.add('d-none');
          catDisplay.classList.remove('d-none');
        };
        catSelect.onchange = function() {
          var newCategory = catSelect.value;
          if (newCategory !== t.category) {
            t.category = newCategory;
            if (commentsMap[t.id]) {
              t.activity = t.activity || [];
              t.activity.unshift({
                type: 'category',
                author: CURRENT_USER,
                action: 'changed category to',
                value: newCategory,
                time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              });
            }
            // Push notification for category change
            NOTIFS.unshift({
              id: Date.now(),
              icon: 'bi-tags-fill',
              bg: '#fef9c3',
              fg: '#92400e',
              title: `Category changed: ${t.id}`,
              body: `${CURRENT_USER} changed category to ${newCategory}`,
              time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              unread: true,
              ticketId: t.id
            });
            showToast({type: 'info', title: 'Category changed', message: `${CURRENT_USER} changed category to ${newCategory}`});
            saveNotifsToStorage();
            renderNotifList && renderNotifList();
            saveTicketsToStorage();
            if (typeof render === 'function') render();
            renderDetail();
          } else {
            catSelect.classList.add('d-none');
            catDisplay.classList.remove('d-none');
          }
        };
      }
    }, 0);
  const t = selectedTicket;
  const comments = commentsMap[t.id] || [];

  // Ticket attachments (screenshots/files)
  let attachmentsHTML = '';
  if (t.attachments && t.attachments.length) {
    attachmentsHTML = '<div class="mb-3"><label class="form-label fw-semibold" style="font-size:13px">Attachments</label><div style="display:flex;flex-wrap:wrap;gap:8px;">';
    attachmentsHTML += t.attachments.map(src => `<img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join('');
    attachmentsHTML += '</div></div>';
  }

  const commentsHTML = comments.length
    ? comments.map(c => `
        <div class="d-flex gap-2 mb-3">
          <div class="avatar-sm ${c.role === 'support' ? 'green' : ''} flex-shrink-0">${initials(c.author)}</div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span class="fw-bold" style="font-size:12.5px">${c.author}</span>
              <span class="comment-role-badge ${c.role}">${c.role === 'client' ? 'Client' : 'Support'}</span>
              <span class="text-muted ms-auto" style="font-size:11px">${c.time}</span>
            </div>
            <p class="mb-0 comment-text" style="font-size:13px;color:#3a4560">${c.text}</p>
            ${c.attachments&&c.attachments.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:7px">${c.attachments.map(src=>`<img src="${src}" style="width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid #e4e9f2;cursor:pointer" onclick="window.open().document.write('<img src=\\''+src+'\\' style=max-width:100%>')">`).join('')}</div>` : ''}
          </div>
        </div>`).join('')
    : `<p class="text-muted mb-0" style="font-size:13px">No comments yet.</p>`;

  // Activity log HTML
  const activityHTML = t.activity && t.activity.length ?
    `<div class="mb-4"><h6 class="fw-bold mb-2" style="font-size:14px">Activity Log</h6><div>
      ${t.activity.map(a => `
        <div style="font-size:12.5px;color:#7a8599;margin-bottom:6px">
          <span style="font-weight:600;color:#3b7cf4">${a.author}</span> ${a.action} <b>${a.value || ''}</b> <span style="font-size:11px;color:#bfc6d1">${a.time}</span>
        </div>`).join('')}
    </div></div>` : '';

  // Preserve active tab
  var activeTab = 'tab-all';
  var tabNav = document.getElementById('ticketTabNav');
  if (tabNav) {
    var current = tabNav.querySelector('.nav-link.active');
    if (current) activeTab = current.id;
  }
  document.getElementById('detailBody').innerHTML = `
    <span class="ticket-id" style="font-family:'JetBrains Mono',monospace; margin-bottom: 10px;">${t.id}</span>
    <h5 class="fw-bold mb-3" style="font-size:18px;line-height:1.3">${t.title}</h5>
    <div class="d-flex gap-2 mb-3">
      ${statusBadgeHTML(t.status)}
      ${prioBadgeHTML(t.priority)}
    </div>
    <div class="detail-desc p-3 mb-3 rounded-3">${t.desc}</div>
    ${attachmentsHTML}
    <div class="row g-3 mb-3">
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Manager</p>
        <div class="d-flex align-items-center gap-2 fw-semibold" style="font-size:13px">
          <div class="avatar-sm ${t.ac}" style="width:22px;height:22px;font-size:9px">${initials(t.manager)}</div>
          <span id="managerDisplay" style="cursor:pointer;text-decoration:underline dotted;">${t.manager}</span>
          <select id="managerSelect" class="form-select form-select-sm d-none" style="width:auto;min-width:120px;font-size:13px;">
            <option value="Sarah Johnson">Sarah Johnson</option>
            <option value="Alex Lee">Alex Lee</option>
            <option value="Priya Patel">Priya Patel</option>
            <option value="David Kim">David Kim</option>
            <option value="Emma Brown">Emma Brown</option>
          </select>
        </div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Created</p>
        <div class="fw-semibold" style="font-size:13px">${t.created}</div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Reporter</p>
        <div class="fw-semibold d-flex align-items-center gap-2" style="font-size:13px">
          <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;display:flex;align-items:center;justify-content:center;border-radius:7px;">${initials(t.reporter)}</div>
          <span>${t.reporter || '—'}</span>
        </div>
      </div>
      <div class="col-6">
        <p class="text-uppercase text-muted fw-semibold mb-1" style="font-size:10.5px;letter-spacing:.6px">Category</p>
        <div class="fw-semibold" style="font-size:13px">
          <span id="categoryDisplay" style="cursor:pointer;text-decoration:underline dotted;">${t.category || '—'}</span>
          <select id="categorySelect" class="form-select form-select-sm d-none" style="width:auto;min-width:120px;font-size:13px;display:inline-block;">
            <option value="Bug">Bug</option>
            <option value="Task">Task</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Performance Issue">Performance Issue</option>
            <option value="Account Issue">Account Issue</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    </div>
    <ul class="nav nav-tabs mb-3" id="ticketTabNav" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="tab-all" data-bs-toggle="tab" data-bs-target="#tabAll" type="button" role="tab" style="font-size:13px">All</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="tab-worklog" data-bs-toggle="tab" data-bs-target="#tabWorklog" type="button" role="tab" style="font-size:13px">Worklog</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" id="tab-comments" data-bs-toggle="tab" data-bs-target="#tabComments" type="button" role="tab" style="font-size:13px">Comments</button>
      </li>
    </ul>
    <div class="tab-content" id="ticketTabContent">
      <div class="tab-pane fade show active" id="tabAll" role="tabpanel">
        ${activityHTML}
        <p class="fw-bold mb-2 mt-3" style="font-size:13px">Comments (${comments.length})</p>
        ${commentsHTML}
      </div>
      <div class="tab-pane fade" id="tabWorklog" role="tabpanel">
        ${activityHTML || '<p class="text-muted">No worklog yet.</p>'}
      </div>
      <div class="tab-pane fade" id="tabComments" role="tabpanel">
        <p class="fw-bold mb-2" style="font-size:13px">Comments (${comments.length})</p>
        ${commentsHTML}
      </div>
    </div>
  `;

  // Sync action dropdowns
  document.getElementById('detailStatus').value   = t.status;
  document.getElementById('detailPriority').value = t.priority;

  // Restore active tab after rendering
  setTimeout(function() {
    var nav = document.getElementById('ticketTabNav');
    var content = document.getElementById('ticketTabContent');
    if (nav && content) {
      var tabBtn = document.getElementById(activeTab);
      if (tabBtn) {
        var tab = new bootstrap.Tab(tabBtn);
        tab.show();
      }
    }
  }, 0);

  // Remove button: only visible for Resolved/Closed
  const rb = document.getElementById('removeTicketBtn');
  rb.style.display = (t.status === 'Resolved' || t.status === 'Closed') ? 'flex' : 'none';
}

function addComment() {
  const txt = document.getElementById('newComment').value.trim();
  if (!txt || !selectedTicket) return;
  const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  commentsMap[selectedTicket.id].push({ author: CURRENT_USER, role: 'client', time: now, text: txt });
  // Also update the ticket's comments in TICKETS
  const t = TICKETS.find(t => t.id === selectedTicket.id);
  if (t) {
    t.comments = [...commentsMap[selectedTicket.id]];
    t.activity = t.activity || [];
    t.activity.unshift({
      type: 'comment',
      author: CURRENT_USER,
      action: 'commented',
      value: txt,
      time: now
    });
    // Push notification for comment
    NOTIFS.unshift({
      id: Date.now(),
      icon: 'bi-chat-left-text-fill',
      bg: '#f0fdf4',
      fg: '#16a34a',
      title: `New comment on ${t.id}`,
      body: `${CURRENT_USER} commented: ${txt}`,
      time: now,
      unread: true,
      ticketId: t.id
    });
    showToast({type: 'info', title: `New comment`, message: `${CURRENT_USER} commented on ${t.id}`});
    // If there are attachments, push notification for attachments
    if (commentAttachments && commentAttachments.length > 0) {
      NOTIFS.unshift({
        id: Date.now()+1,
        icon: 'bi-paperclip',
        bg: '#e0e7ff',
        fg: '#3730a3',
        title: `Attachment added to ${t.id}`,
        body: `${CURRENT_USER} added ${commentAttachments.length} attachment(s) to a comment`,
        time: now,
        unread: true,
        ticketId: t.id
      });
      showToast({type: 'info', title: `Attachment added`, message: `${CURRENT_USER} added ${commentAttachments.length} attachment(s)`});
    }
    renderNotifList();
  }
  saveTicketsToStorage();
  document.getElementById('newComment').value = '';
  renderDetail();
}

// ── ENABLE ENTER TO SUBMIT COMMENT ───────────
document.addEventListener('DOMContentLoaded', function() {
      // Set reporter field to user context (from localStorage)
      const ctReporter = document.getElementById('ctReporter');
      if (ctReporter) {
        ctReporter.value = CURRENT_USER;
      }
      // Set sidebar name/avatar if present
      const nameEl = document.querySelector('.user-info .fw-semibold');
      if (nameEl) {
        nameEl.textContent = CURRENT_USER;
      }
      const avatarEl = document.getElementById('clientAvatar');
      if (avatarEl && CURRENT_USER) {
        const initials = CURRENT_USER.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        avatarEl.textContent = initials;
        avatarEl.title = CURRENT_USER + ' – Client';
      }
    // Dynamically render developer options in create ticket modal
    const ctDeveloper = document.getElementById('ctDeveloper');
    if (ctDeveloper) {
      let agents = [];
      try {
        agents = JSON.parse(localStorage.getItem('servicedesk_agents')) || ['Sarah Johnson','Alex Lee','Priya Patel','David Kim','Emma Brown'];
      } catch(e) {
        agents = ['Sarah Johnson','Alex Lee','Priya Patel','David Kim','Emma Brown'];
      }
      ctDeveloper.innerHTML = agents.map(a => `<option value="${a}">${a}</option>`).join('');
    }

    // Dynamically render manager options in create ticket modal
    const ctManager = document.getElementById('ctManager');
    if (ctManager) {
      // Use the same PMs as in the login page
      const managers = JSON.parse(localStorage.getItem('servicedesk_pms')) || ['Matthew Samson', 'John Doe'];
      ctManager.innerHTML = managers.map(m => `<option value="${m}">${m}</option>`).join('');
    }
  var commentBox = document.getElementById('newComment');
  if (commentBox) {
    commentBox.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitComment(); // Use unified comment logic
      }
    });
  }
});
// ── CLIENT ACTIONS ────────────────────────────
function updateStatus(val) {
  if (!selectedTicket) return;
  const prev = selectedTicket.status;
  selectedTicket.status = val;
  // Update in TICKETS array
  const t = TICKETS.find(t => t.id === selectedTicket.id);
  if (t) {
    t.status = val;
    t.activity = t.activity || [];
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    t.activity.unshift({
      type: 'status',
      author: CURRENT_USER,
      action: `set status to`,
      value: val,
      time: now
    });
    // Push notification
    NOTIFS.unshift({
      id: Date.now(),
      icon: 'bi-arrow-clockwise',
      bg: '#fef9c3',
      fg: '#92400e',
      title: `Status updated: ${t.id}`,
      body: `${CURRENT_USER} set status to ${val}`,
      time: now,
      unread: true,
      ticketId: t.id
    });
    showToast({type: 'info', title: `Status updated`, message: `${CURRENT_USER} set status to ${val}`});
    renderNotifList();
  }
  saveTicketsToStorage();
  renderDetail();
  if (typeof window._pageRender === 'function') window._pageRender();
}

function updatePriority(val) {
  if (!selectedTicket) return;
  const prev = selectedTicket.priority;
  selectedTicket.priority = val;
  // Update in TICKETS array
  const t = TICKETS.find(t => t.id === selectedTicket.id);
  if (t) {
    t.priority = val;
    t.activity = t.activity || [];
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    t.activity.unshift({
      type: 'priority',
      author: CURRENT_USER,
      action: `set priority to`,
      value: val,
      time: now
    });
    // Push notification
    NOTIFS.unshift({
      id: Date.now(),
      icon: 'bi-flag-fill',
      bg: '#ffedd5',
      fg: '#9a3412',
      title: `Priority updated: ${t.id}`,
      body: `${CURRENT_USER} set priority to ${val}`,
      time: now,
      unread: true,
      ticketId: t.id
    });
    showToast({type: 'info', title: `Priority updated`, message: `${CURRENT_USER} set priority to ${val}`});
    renderNotifList();
  }
  saveTicketsToStorage();
  renderDetail();
  if (typeof window._pageRender === 'function') window._pageRender();
}

function removeTicket(dataSource) {
  if (!selectedTicket) return;
  if (selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed') {
    // Show modal instead of alert
    var msg = document.getElementById('removeTicketModalMsg');
    if (msg) msg.textContent = 'Only Resolved or Closed tickets can be removed.';
    var modal = new bootstrap.Modal(document.getElementById('removeTicketModal'));
    modal.show();
    return;
  }
  // Show confirmation modal for valid removals
  var confirmModal = new bootstrap.Modal(document.getElementById('confirmRemoveTicketModal'));
  confirmModal.show();
  // Set up confirm button handler
  var confirmBtn = document.getElementById('confirmRemoveTicketBtn');
  if (confirmBtn) {
    // Remove any previous handler
    confirmBtn.onclick = function() {
      confirmModal.hide();
      // Actually remove the ticket
      const source = dataSource || TICKETS;
      const idx = source.findIndex(t => t.id === selectedTicket.id);
      if (idx > -1) source.splice(idx, 1);
      // Remove from TICKETS array if not already
      const mainIdx = TICKETS.findIndex(t => t.id === selectedTicket.id);
      if (mainIdx > -1) TICKETS.splice(mainIdx, 1);
      // Push notification for removal
      NOTIFS.unshift({
        id: Date.now(),
        icon: 'bi-trash-fill',
        bg: '#fee2e2',
        fg: '#b91c1c',
        title: `Ticket removed: ${selectedTicket.id}`,
        body: `${CURRENT_USER} removed the ticket`,
        time: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        unread: true,
        ticketId: selectedTicket.id
      });
      showToast({type: 'error', title: `Ticket removed`, message: `${CURRENT_USER} removed the ticket`});
      renderNotifList();
      saveTicketsToStorage();
      bootstrap.Offcanvas.getInstance(document.getElementById('ticketOffcanvas')).hide();
      selectedTicket = null;
      if (typeof window._pageRender === 'function') window._pageRender();
    };
  }
}

// ── NOTIFICATIONS ──────────────────────────────
function renderNotifList() {
  const unread = NOTIFS.filter(n => n.unread).length;
  document.getElementById('notifDot').style.display = unread > 0 ? 'block' : 'none';
  document.getElementById('notifList').innerHTML =
    NOTIFS.map(n => `
      <div class="notif-row ${n.unread ? 'unread' : ''}" onclick="openDetail('${n.ticketId || (n.title && n.title.match(/TK-\d{3}/) ? n.title.match(/TK-\d{3}/)[0] : '')}')">
        <div class="notif-icon-sm" style="background:${n.bg};color:${n.fg}"><i class="bi ${n.icon}"></i></div>
        <div class="flex-grow-1">
          <div class="fw-semibold" style="font-size:12.5px;color:#1a2235">${n.title}</div>
          <div class="text-muted" style="font-size:12px;line-height:1.4">${n.body}</div>
          <div class="text-muted mt-1" style="font-size:11px"><i class="bi bi-clock me-1"></i>${n.time}</div>
        </div>
      </div>`).join('') +
    `<div class="text-center py-2 border-top"><span class="text-muted" style="font-size:12px">${unread} unread · ${NOTIFS.length} total</span></div>`;
  saveNotifsToStorage();
}

function markNotifRead(id) { const n = NOTIFS.find(x => x.id === id); if(n){ n.unread=false; renderNotifList(); } }
function markAllRead()     { NOTIFS.forEach(n => n.unread = false); renderNotifList(); }
function deleteAllNotifs() {
  NOTIFS.length = 0;
  saveNotifsToStorage();
  renderNotifList();
}

// ── SCREENSHOT HANDLERS ───────────────────────
function initScreenshots() {
  const dropZone  = document.getElementById('ctDropZone');
  const fileInput = document.getElementById('ctFileInput');
  dropZone.addEventListener('click',     () => fileInput.click());
  fileInput.addEventListener('change',   e  => { addFiles(Array.from(e.target.files), 'ct'); fileInput.value=''; });
  dropZone.addEventListener('dragover',  e  => { e.preventDefault(); dropZone.classList.add('drag-over'); });
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
  document.getElementById('newComment').addEventListener('paste', e => {
    const imgs = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
    if (imgs.length) { e.preventDefault(); addFiles(imgs, 'comment'); }
  });
}

function addFiles(files, target) {
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      if (target === 'ct')  { ctAttachments.push(ev.target.result);      renderPreviews(ctAttachments,      'ctPreview',      'ct'); }
      else                  { commentAttachments.push(ev.target.result);  renderPreviews(commentAttachments, 'commentPreview', 'comment'); }
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews(arr, cid, target) {
  document.getElementById(cid).innerHTML = arr.map((src, i) => `
    <div class="screenshot-thumb">
      <img src="${src}" onclick="window.open().document.write('<img src=${JSON.stringify(src)} style=max-width:100%>')"/>
      <div class="remove-img" onclick="removeAttachment(${i},'${target}')"><i class="bi bi-x"></i></div>
    </div>`).join('');
}

function removeAttachment(i, target) {
  if (target === 'ct')  { ctAttachments.splice(i,1);      renderPreviews(ctAttachments,      'ctPreview',      'ct'); }
  else                  { commentAttachments.splice(i,1);  renderPreviews(commentAttachments, 'commentPreview', 'comment'); }
}

// ── INIT ───────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initOffcanvas();
  window._pageRender = render;
  renderNotifList();
  initScreenshots();
  render();

  document.getElementById('filterStatus').addEventListener('change',   e => { fStatus   = e.target.value; page=1; render(); });
  document.getElementById('filterPriority').addEventListener('change', e => { fPriority = e.target.value; page=1; render(); });
  document.getElementById('searchInput').addEventListener('input',     e => { fSearch   = e.target.value.trim().toLowerCase(); page=1; render(); });
});

// ── TABLE ──────────────────────────────────────
function getFiltered() {
  let list = [...TICKETS];
  // Only show tickets for the current client user (not PM)
  if (localStorage.getItem('servicedesk_current_role') !== 'pm') {
    list = list.filter(t => t.reporter === CURRENT_USER);
  }
  if (fStatus)   list = list.filter(t => t.status   === fStatus);
  if (fPriority) list = list.filter(t => t.priority === fPriority);
  if (fSearch)   list = list.filter(t =>
    t.id.toLowerCase().includes(fSearch) ||
    t.title.toLowerCase().includes(fSearch) ||
    (t.reporter||'').toLowerCase().includes(fSearch) ||
    t.manager.toLowerCase().includes(fSearch)
  );
  list.sort((a,b) => (a[sortField]||'').localeCompare(b[sortField]||'') * sortDir);
  return list;
}

function sortBy(f) { sortDir = sortField===f ? sortDir*-1 : 1; sortField=f; page=1; render(); }
function goPage(p) {
  const pages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));
  if (p<1 || p>pages) return;
  page=p; render();
}

function render() {
  const filtered = getFiltered(), total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > pages) page = pages;
  const from  = (page-1) * PAGE_SIZE;
  const items = filtered.slice(from, from + PAGE_SIZE);

  // Only count tickets for the current client user (not PM)
  let visibleTickets = TICKETS;
  if (localStorage.getItem('servicedesk_current_role') !== 'pm') {
    visibleTickets = TICKETS.filter(t => t.reporter === CURRENT_USER);
  }
  document.getElementById('statTotal').textContent    = visibleTickets.length;
  document.getElementById('statOpen').textContent     = visibleTickets.filter(t=>t.status==='Open').length;
  document.getElementById('statProgress').textContent = visibleTickets.filter(t=>t.status==='In Progress').length;
  document.getElementById('statResolved').textContent = visibleTickets.filter(t=>t.status==='Resolved').length;
  document.getElementById('ticketCountBadge').textContent = `${total} found`;
  // Only show sidebar count for the current client user (not PM)
  if (localStorage.getItem('servicedesk_current_role') !== 'pm') {
    document.getElementById('sidebarCount').textContent = visibleTickets.length;
  } else {
    document.getElementById('sidebarCount').textContent = TICKETS.length;
  }

  const tbody = document.getElementById('ticketTableBody');
  const empty = document.getElementById('emptyState');
  if (!items.length) {
    tbody.innerHTML = ''; empty.classList.remove('d-none');
  } else {
    empty.classList.add('d-none');
    tbody.innerHTML = items.map(t => `
      <tr onclick="openDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td>${statusBadgeHTML(t.status)}</td>
        <td>${prioBadgeHTML(t.priority)}</td>
        <td><span class="badge rounded-pill" style="background:${
          t.category==='Bug' ? '#ffe4e6' :
          t.category==='Task' ? '#eff4ff' :
          t.category==='Feature Request' ? '#e0f2fe' :
          t.category==='Performance Issue' ? '#fef9c3' :
          t.category==='Account Issue' ? '#ede9fe' :
          t.category==='Other' ? '#f3e8ff' : '#eff4ff'};color:${
          t.category==='Bug' ? '#be123c' :
          t.category==='Task' ? '#3b7cf4' :
          t.category==='Feature Request' ? '#0369a1' :
          t.category==='Performance Issue' ? '#78350f' :
          t.category==='Account Issue' ? '#6d28d9' :
          t.category==='Other' ? '#a21caf' : '#3b7cf4'};font-size:11px">
          <i class="bi ${
            t.category==='Bug' ? 'bi-bug' :
            t.category==='Task' ? 'bi-list-task' :
            t.category==='Feature Request' ? 'bi-stars' :
            t.category==='Performance Issue' ? 'bi-speedometer2' :
            t.category==='Account Issue' ? 'bi-person-badge' :
            t.category==='Other' ? 'bi-three-dots' : 'bi-check2-square'} me-1"></i>${t.category||'—'}</span></td>
        <td style="font-size:12.5px;color:#3a4560;font-weight:500">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-sm" style="background:#e0e7ef;color:#3b3b4f;width:22px;height:22px;font-size:9px;display:flex;align-items:center;justify-content:center;border-radius:7px;">${initials(t.reporter)}</div>
            <span>${t.reporter||'—'}</span>
          </div>
        </td>
        <td><div class="d-flex align-items-center gap-2">
          <div class="avatar-sm ${t.ac}">${initials(t.manager)}</div>
          <span style="font-size:12.5px">${t.manager}</span>
        </div></td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>`).join('');
  }

  document.getElementById('pageFrom').textContent  = total ? from+1 : 0;
  document.getElementById('pageTo').textContent    = Math.min(from+PAGE_SIZE, total);
  document.getElementById('pageTotal').textContent = total;
  document.getElementById('pageControls').innerHTML = renderPagination(page, total, 'goPage');
}

// ── CREATE TICKET ─────────────────────────────
// Helper to generate the next unique ticket ID
function getNextTicketId() {
  let max = 0;
  for (const t of TICKETS) {
    const match = /^TK-(\d+)$/.exec(t.id);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return 'TK-' + String(max + 1).padStart(3, '0');
}
function submitTicket() {
  const title    = document.getElementById('ctTitle').value.trim();
  const priority = document.getElementById('ctPriority').value;
  const category = document.getElementById('ctCategory').value;
  const reporter = document.getElementById('ctReporter').value;
  const manager = document.getElementById('ctManager') ? document.getElementById('ctManager').value : 'Sarah Johnson';
  const desc     = document.getElementById('ctDesc').value.trim();
  if (!title || !desc) { alert('Title and Description are required.'); return; }
  const id  = getNextTicketId();
  const now = new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  // Only add the ticket if the reporter matches the CURRENT_USER (client)
  const newTicket = { id, title, status:'Open', priority, category, reporter, manager, ac:'', created:now, desc, comments:[], attachments:[...ctAttachments] };
  TICKETS.unshift(newTicket);
  commentsMap[id] = [];
  // If not PM, only update the UI for the current client
  if (localStorage.getItem('servicedesk_current_role') !== 'pm') {
    // Optionally, you could filter TICKETS here, but getFiltered() already does this
    // So just ensure the ticket is created with the correct reporter
  }
  // Add notification for ticket creation
  NOTIFS.unshift({
    id: Date.now(),
    icon: 'bi-plus-lg',
    bg: '#e0f2fe',
    fg: '#0284c7',
    title: `Ticket created: ${id}`,
    body: `${CURRENT_USER} created a new ticket: ${title}`,
    time: now,
    unread: true,
    ticketId: id
  });
  showToast({type: 'success', title: `Ticket created`, message: `${CURRENT_USER} created a new ticket: ${title}`});
  saveNotifsToStorage();
  saveTicketsToStorage();
  document.getElementById('ctTitle').value   = '';
  document.getElementById('ctDesc').value    = '';
  ctAttachments = [];
  document.getElementById('ctPreview').innerHTML = '';
  bootstrap.Modal.getInstance(document.getElementById('createTicketModal')).hide();
  renderNotifList();
  render();
}

// ── COMMENT + SCREENSHOT ──────────────────────
function submitComment() {
  const txt = document.getElementById('newComment').value.trim();
  if (!txt && !commentAttachments.length) return;
  if (!selectedTicket) return;
  const now = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  commentsMap[selectedTicket.id].push({ author: CURRENT_USER, role:'client', time:now, text:txt, attachments:[...commentAttachments] });
  // Also update the ticket's comments in TICKETS
  const t = TICKETS.find(t => t.id === selectedTicket.id);
  if (t) {
    t.comments = [...commentsMap[selectedTicket.id]];
    t.activity = t.activity || [];
    // Log comment activity
    if (txt) {
      t.activity.unshift({
        type: 'comment',
        author: CURRENT_USER,
        action: 'commented',
        value: txt,
        time: now
      });
      // Push notification for comment
      NOTIFS.unshift({
        id: Date.now(),
        icon: 'bi-chat-left-text-fill',
        bg: '#f0fdf4',
        fg: '#16a34a',
        title: `New comment on ${t.id}`,
        body: `${CURRENT_USER} commented: ${txt}`,
        time: now,
        unread: true,
        ticketId: t.id
      });
      showToast({type: 'info', title: `New comment`, message: `${CURRENT_USER} commented on ${t.id}`});
    }
    // Log attachment activity and notification
    if (commentAttachments && commentAttachments.length > 0) {
      t.activity.unshift({
        type: 'attachment',
        author: CURRENT_USER,
        action: 'added attachment(s)',
        value: `${commentAttachments.length} file(s)`,
        time: now
      });
      NOTIFS.unshift({
        id: Date.now()+1,
        icon: 'bi-paperclip',
        bg: '#e0e7ff',
        fg: '#3730a3',
        title: `Attachment added to ${t.id}`,
        body: `${CURRENT_USER} added ${commentAttachments.length} attachment(s) to a comment`,
        time: now,
        unread: true,
        ticketId: t.id
      });
      showToast({type: 'info', title: `Attachment added`, message: `${CURRENT_USER} added ${commentAttachments.length} attachment(s)`});
    }
    renderNotifList();
  }
  saveTicketsToStorage();
  document.getElementById('newComment').value = '';
  commentAttachments = [];
  document.getElementById('commentPreview').innerHTML = '';
  renderDetail();
}

function doRemoveTicket() { removeTicket(TICKETS); }

function exportCSV(){
  const rows=getFiltered().map(t=>[t.id,`"${t.title}"`,t.status,t.priority,t.manager,t.created]);
  const csv=[['Ticket ID','Title','Status','Priority','Manager','Created'],...rows].map(r=>r.join(',')).join('\n');
  const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv); a.download='support-tickets.csv'; a.click();
}

// ── MY TICKETS PAGE ───────────────────────────────────
// Client's own tickets (subset of TICKETS)
const MY_TICKET_IDS = ['TK-001','TK-004','TK-005','TK-009','TK-012','TK-016','TK-019','TK-020'];

function initMyTicketsPage() {
  const ticketsData = TICKETS.filter(t => MY_TICKET_IDS.includes(t.id));
  const PRIO_BORDER = { 'Critical':'priority-critical', 'High':'priority-high', 'Medium':'priority-medium', 'Low':'priority-low' };

  let myPage = 1, myFStatus = '', myFPriority = '', myFSearch = '', viewMode = 'card';

  function initOffcanvasDetail() {
    offcanvas = new bootstrap.Offcanvas(document.getElementById('ticketOffcanvas'));
  }

  function updateMyStats() {
    document.getElementById('myStat0').textContent = ticketsData.length;
    document.getElementById('myStat1').textContent = ticketsData.filter(t => t.status === 'Open').length;
    document.getElementById('myStat2').textContent = ticketsData.filter(t => t.status === 'In Progress').length;
    document.getElementById('myStat3').textContent = ticketsData.filter(t => t.status === 'Resolved').length;
    const myTicketsCountEl = document.getElementById('myTicketsCount');
    if (myTicketsCountEl) myTicketsCountEl.textContent = ticketsData.length;
  }

  function getMyFiltered() {
    let list = [...ticketsData];
    if (myFStatus)   list = list.filter(t => t.status === myFStatus);
    if (myFPriority) list = list.filter(t => t.priority === myFPriority);
    if (myFSearch)   list = list.filter(t =>
      t.id.toLowerCase().includes(myFSearch) ||
      t.title.toLowerCase().includes(myFSearch)
    );
    return list;
  }

  function goMyPage(p) {
    const pages = Math.max(1, Math.ceil(getMyFiltered().length / PAGE_SIZE));
    if (p < 1 || p > pages) return;
    myPage = p; renderMyTickets();
  }
  window.goMyPage = goMyPage;

  function statusBadgeHTML(status) {
    return `<span class="badge bg-${STATUS_CLASS[status]} rounded-pill" style="font-size:11px">${status}</span>`;
  }

  function prioBadgeHTML(priority) {
    return `<span class="badge rounded-pill" style="${PRIO_STYLE[priority]};font-size:11px">${priority}</span>`;
  }

  function renderMyTickets() {
    const filtered = getMyFiltered(), total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (myPage > pages) myPage = pages;
    const from = (myPage - 1) * PAGE_SIZE, items = filtered.slice(from, from + PAGE_SIZE);

    document.getElementById('countBadge').textContent  = `${total} found`;
    document.getElementById('pageFrom').textContent    = total ? from + 1 : 0;
    document.getElementById('pageTo').textContent      = Math.min(from + PAGE_SIZE, total);
    document.getElementById('pageTotal').textContent   = total;

    // Pagination
    let btns=`<button class="page-btn" onclick="goMyPage(${myPage-1})" ${myPage===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
    let s=Math.max(1,myPage-2), e=Math.min(pages,s+4);
    if(e-s<4) s=Math.max(1,e-4);
    for(let p=s;p<=e;p++) btns+=`<button class="page-btn ${p===myPage?'active':''}" onclick="goMyPage(${p})">${p}</button>`;
    btns+=`<button class="page-btn" onclick="goMyPage(${myPage+1})" ${myPage===pages?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
    document.getElementById('pageControls').innerHTML=btns;

    updateMyStats();

    if (viewMode === 'card') renderMyCards(items);
    else renderMyTable(items);
  }

  function renderMyCards(items) {
    const grid  = document.getElementById('cardGrid');
    const empty = document.getElementById('cardEmpty');
    if (!items.length) { grid.innerHTML = ''; empty.classList.remove('d-none'); return; }
    empty.classList.add('d-none');
    grid.innerHTML = items.map(t => `
      <div class="col-6" onclick="openMyDetail('${t.id}')">
        <div class="ticket-card ${PRIO_BORDER[t.priority]}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <span class="ticket-id">${t.id}</span>
            ${statusBadgeHTML(t.status)}
          </div>
          <p class="fw-semibold mb-2" style="font-size:13.5px;color:#1a2235;line-height:1.4">${t.title}</p>
          <p class="text-muted mb-3" style="font-size:12px;line-height:1.5">${t.desc.substring(0,80)}...</p>
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <div class="avatar-sm ${t.ac}" style="width:22px;height:22px;font-size:9px;display:flex;align-items:center;justify-content:center;border-radius:7px;">${initials(t.manager)}</div>
              <span class="text-muted" style="font-size:11.5px">${t.manager}</span>
            </div>
            ${prioBadgeHTML(t.priority)}
          </div>
        </div>
      </div>`).join('');
  }

  function renderMyTable(items) {
    const tbody = document.getElementById('tableBody');
    if (!items.length) { 
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted">No tickets found.</td></tr>`; 
      return; 
    }
    tbody.innerHTML = items.map(t => `
      <tr onclick="openMyDetail('${t.id}')">
        <td><span class="ticket-id">${t.id}</span></td>
        <td class="fw-medium" style="color:#1a2235">${t.title}</td>
        <td>${statusBadgeHTML(t.status)}</td>
        <td>${prioBadgeHTML(t.priority)}</td>
        <td class="text-muted" style="font-size:12px">${t.created}</td>
      </tr>`).join('');
  }

  function openMyDetail(id) {
    selectedTicket = ticketsData.find(t => t.id === id);
    if (!selectedTicket) return;
    document.getElementById('detailTid').textContent = selectedTicket.id;
    document.getElementById('detailStatus').value = selectedTicket.status;
    document.getElementById('detailPriority').value = selectedTicket.priority;
    document.getElementById('newComment').value = '';
    renderDetail();
    offcanvas.show();
  }
  window.openMyDetail = openMyDetail;

  function submitNewTicket() {
    const title    = document.getElementById('newTitle').value.trim();
    const priority = document.getElementById('newPriority').value;
    const manager = document.getElementById('newManager') ? document.getElementById('newManager').value : 'Sarah Johnson';
    const desc     = document.getElementById('newDesc').value.trim();
    if (!title || !desc) return;
    const id  = getNextTicketId();
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newTicket = { 
      id, title, status: 'Open', priority, 
      manager, ac: '', created: now, 
      desc, comments: [] 
    };
    ticketsData.unshift(newTicket);
    TICKETS.unshift(newTicket);
    MY_TICKET_IDS.unshift(id);
    commentsMap[id] = [];
    bootstrap.Modal.getInstance(document.getElementById('newTicketModal')).hide();
    document.getElementById('newTitle').value = '';
    document.getElementById('newDesc').value  = '';
    updateMyStats(); 
    renderMyTickets();
  }
  window.submitTicket = submitNewTicket;

  function doRemoveMyTicket() {
    if (!selectedTicket) return;
    if (selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed') {
      // Show modal instead of alert
      var msg = document.getElementById('removeTicketModalMsg');
      if (msg) msg.textContent = 'Only Resolved or Closed tickets can be removed.';
      var modal = new bootstrap.Modal(document.getElementById('removeTicketModal'));
      modal.show();
      return;
    }
    // Show confirmation modal for valid removals
    var confirmModal = new bootstrap.Modal(document.getElementById('confirmRemoveTicketModal'));
    confirmModal.show();
    // Set up confirm button handler
    var confirmBtn = document.getElementById('confirmRemoveTicketBtn');
    if (confirmBtn) {
      confirmBtn.onclick = function() {
        confirmModal.hide();
        // Actually remove the ticket
        const idx = ticketsData.findIndex(t => t.id === selectedTicket.id);
        if (idx > -1) ticketsData.splice(idx, 1);
        const mainIdx = TICKETS.findIndex(t => t.id === selectedTicket.id);
        if (mainIdx > -1) TICKETS.splice(mainIdx, 1);
        const idIdx = MY_TICKET_IDS.indexOf(selectedTicket.id);
        if (idIdx > -1) MY_TICKET_IDS.splice(idIdx, 1);
        bootstrap.Offcanvas.getInstance(document.getElementById('ticketOffcanvas')).hide();
        selectedTicket = null;
        updateMyStats();
        renderMyTickets();
      };
    }
  }
  window.doRemoveTicket = doRemoveMyTicket;

  // Event Listeners
  initOffcanvasDetail();
  updateMyStats();
  renderMyTickets();

  document.getElementById('filterStatus').addEventListener('change',   e => { myFStatus   = e.target.value; myPage = 1; renderMyTickets(); });
  document.getElementById('filterPriority').addEventListener('change', e => { myFPriority = e.target.value; myPage = 1; renderMyTickets(); });
  document.getElementById('searchInput').addEventListener('input',     e => { myFSearch   = e.target.value.trim().toLowerCase(); myPage = 1; renderMyTickets(); });

  document.getElementById('viewCard').addEventListener('click', () => {
    viewMode = 'card';
    document.getElementById('viewCard').classList.add('active');
    document.getElementById('viewTable').classList.remove('active');
    document.getElementById('cardView').classList.remove('d-none');
    document.getElementById('tableView').classList.add('d-none');
    renderMyTickets();
  });
  document.getElementById('viewTable').addEventListener('click', () => {
    viewMode = 'table';
    document.getElementById('viewTable').classList.add('active');
    document.getElementById('viewCard').classList.remove('active');
    document.getElementById('tableView').classList.remove('d-none');
    document.getElementById('cardView').classList.add('d-none');
    renderMyTickets();
  });
}

// Auto-initialize my-tickets page if elements exist
if (document.getElementById('myStat0')) {
  window.addEventListener('DOMContentLoaded', initMyTicketsPage);
}

// ── TOASTS ───────────────────────────────────
function showToast({type = 'info', title = '', message = ''}) {
  const config = {
    success: {bg: '#bbf7d0', fg: '#166534', icon: 'bi-check-circle'},
    info:    {bg: '#bae6fd', fg: '#075985', icon: 'bi-info-circle'},
    warning: {bg: '#fef3c7', fg: '#92400e', icon: 'bi-exclamation-circle'},
    error:   {bg: '#fecaca', fg: '#b91c1c', icon: 'bi-x-circle'}
  };
  const {bg, fg, icon} = config[type] || config.info;
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 start-0 p-3'; // changed end-0 to start-0
    container.style.zIndex = 9999;
    document.body.appendChild(container);
  }
  const toastId = 'toast-' + Math.random().toString(36).slice(2, 10);
  const toast = document.createElement('div');
  toast.className = 'toast show d-flex align-items-center mb-2';
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.background = bg;
  toast.style.color = fg;
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  toast.style.minWidth = '360px';
  toast.style.maxWidth = '450px';
  toast.innerHTML = `
    <div class="d-flex align-items-center px-3 py-2 flex-grow-1">
      <i class="bi ${icon} me-2" style="font-size:20px;color:${fg}"></i>
      <div>
        <div class="fw-semibold" style="font-size:15px;color:${fg}">${title}</div>
        <div style="font-size:13px;color:${fg}">${message}</div>
      </div>
    </div>
    <button type="button" class="btn-close ms-3 me-2" style="filter:invert(0.7);" aria-label="Close"></button>
  `;
  toast.querySelector('.btn-close').onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
// Add a test button to window for manual toast testing
window.testToast = function() {
  showToast({type: 'success', title: 'Success', message: 'This is a test toast!'});
};
// You can now run testToast() in the browser console to verify toast appearance.

// ── LOGOUT HANDLER ─────────────────────────
window.doLogout = function doLogout() {
  window.location.href = 'index.html';
};

